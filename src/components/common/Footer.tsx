import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-sm text-gray-500 dark:text-gray-400 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300">
            AppieTools &copy; {new Date().getFullYear()} &bull;{' '}
            <a
              href="https://appietools.hooijmaijers.me"
              className="hover:text-ah-blue transition-colors underline decoration-dotted"
            >
              appietools.hooijmaijers.me
            </a>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Niet gelieerd aan of goedgekeurd door Koninklijke Ahold Delhaize N.V. Gemaakt voor vervangende labels in de winkel of thuis.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <a
            href="https://github.com/RatelSlop/AppieTools"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-ah-blue transition-colors"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
};
