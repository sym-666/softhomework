import type { ReactNode } from 'react';

interface StepsGuideProps {
  title: string;
  steps: { title: string; description: string }[];
  action?: ReactNode;
}

/** 还没有数据时告诉用户下一步做什么，比一句“暂无内容”有用 */
export function StepsGuide({ title, steps, action }: StepsGuideProps) {
  return (
    <div className="px-6 py-10">
      <h2 className="text-center text-sm font-semibold text-gray-900">
        {title}
      </h2>
      <ol className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-sm bg-gray-50 p-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--office-blue)] text-xs font-semibold text-white">
              {index + 1}
            </span>
            <p className="mt-2 text-sm font-medium text-gray-800">
              {step.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
      {action && <div className="mt-6 text-center">{action}</div>}
    </div>
  );
}
