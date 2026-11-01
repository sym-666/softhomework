import { Link } from 'wouter';
import { BookOpen, Library } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@/shadcn/components/ui/button';

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1400px] border border-gray-200 bg-white px-6 py-16 text-center">
      <BookOpen className="mx-auto mb-3 text-[var(--office-blue)]" size={34} />
      <h1 className="text-base font-semibold text-gray-900">
        <FormattedMessage id="home.title" />
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        <FormattedMessage id="home.subtitle" />
      </p>
      <Button
        asChild
        size="sm"
        className="mt-5 rounded-sm bg-[var(--office-blue)]"
      >
        <Link href="/papers">
          <Library />
          <FormattedMessage id="home.openLibrary" />
        </Link>
      </Button>
    </div>
  );
}
