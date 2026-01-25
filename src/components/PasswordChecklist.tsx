import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordChecklistProps {
  password: string;
}

const checks = [
  {
    label: 'Min. 8 characters',
    test: (pw: string) => pw.length >= 8,
  },
  {
    label: 'Include lowercase letter',
    test: (pw: string) => /[a-z]/.test(pw),
  },
  {
    label: 'Include uppercase letter',
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: 'Include number',
    test: (pw: string) => /\d/.test(pw),
  },
  {
    label: 'Include a special character: # . - ? ! @ $ % ^ & *',
    test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  },
];

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ password }) => (
  <div className="mt-2 rounded-lg border border-border bg-muted/50 p-3 shadow-sm">
    <div className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
      {checks.map((item) => {
        const passed = item.test(password);
        return (
          <div key={item.label} className={`flex items-center gap-2 ${passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);
