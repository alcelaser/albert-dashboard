import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 15_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-950">
        <ConnectionStatus />
        <Header />
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      </div>
    </QueryClientProvider>
  );
}

export default App;
