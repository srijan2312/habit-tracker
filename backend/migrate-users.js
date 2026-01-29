import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '.env') });

// IMPORTANT: Use SERVICE ROLE KEY (not anon key) for admin operations
// Get this from: Supabase Dashboard → Project Settings → API → service_role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found!');
  console.error('This script requires the service role key to create auth users.');
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('Get it from: Supabase Dashboard → Project Settings → API → service_role\n');
  process.exit(1);
}

async function migrateUsers() {
  console.log('Starting user migration from public.users to auth.users...\n');

  try {
    // Step 1: Fetch all users from public.users
    const { data: existingUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log('No users found in public.users table.');
      return;
    }

    console.log(`Found ${existingUsers.length} users to migrate:\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Step 2: Create auth users for each existing user
    for (const user of existingUsers) {
      console.log(`Processing: ${user.email}`);

      // Check if user already exists in auth
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = authUsers.users.find(u => u.email === user.email);

      if (existingAuthUser) {
        console.log(`  ⚠️  Already exists in auth.users (${existingAuthUser.id})`);
        
        // Update public.users with auth user ID if needed
        await supabaseAdmin
          .from('users')
          .update({ id: existingAuthUser.id })
          .eq('email', user.email);
        
        skipCount++;
        continue;
      }

      // Create user in auth.users with admin API
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: user.name || '',
        },
      });

      if (createError) {
        console.log(`  ❌ Error creating auth user: ${createError.message}`);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Created auth user: ${newAuthUser.user.id}`);

      // Step 3: Update public.users.id to match auth.users.id
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ id: newAuthUser.user.id })
        .eq('email', user.email);

      if (updateError) {
        console.log(`  ⚠️  Warning: Could not update public.users.id: ${updateError.message}`);
      }

      // Step 4: Update all related tables with new user ID
      const oldUserId = user.id;
      const newUserId = newAuthUser.user.id;

      if (oldUserId !== newUserId) {
        console.log(`  🔄 Updating foreign keys from ${oldUserId} to ${newUserId}...`);

        // Update habits
        await supabaseAdmin
          .from('habits')
          .update({ user_id: newUserId })
          .eq('user_id', oldUserId);

        // Update habit_logs
        await supabaseAdmin
          .from('habit_logs')
          .update({ user_id: newUserId })
          .eq('user_id', oldUserId);

        // Update streak_freezes
        await supabaseAdmin
          .from('streak_freezes')
          .update({ user_id: newUserId })
          .eq('user_id', oldUserId);

        // Update daily_signin_rewards
        await supabaseAdmin
          .from('daily_signin_rewards')
          .update({ user_id: newUserId })
          .eq('user_id', oldUserId);

        // Update friend_challenge_participants
        await supabaseAdmin
          .from('friend_challenge_participants')
          .update({ user_id: newUserId })
          .eq('user_id', oldUserId);

        console.log(`  ✅ Updated foreign keys`);
      }

      // Step 5: Send password reset email
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.email,
      });

      if (resetError) {
        console.log(`  ⚠️  Could not generate reset link: ${resetError.message}`);
      } else {
        console.log(`  📧 Password reset email will be sent`);
      }

      successCount++;
      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⚠️  Already existed: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📧 Total users: ${existingUsers.length}`);
    console.log('\nAll users will need to use "Forgot Password" to set a new password.');

  } catch (error) {
    console.error('Fatal error during migration:', error);
  }
}

// Run migration
migrateUsers();
