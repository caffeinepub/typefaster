import { SiCoffeescript } from 'react-icons/si';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            © 2025. Built with{' '}
            <Heart className="w-4 h-4 text-red-500 fill-red-500 inline" />{' '}
            using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <SiCoffeescript className="w-4 h-4" />
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
