import TopNavMorador from '@/components/TopNavMorador';
import BottomNavMorador from '@/components/BottomNavMorador';

export default function MoradorLayout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <TopNavMorador />
      <main className="flex-1 overflow-y-auto pb-20"> 
        {children}
      </main>
      <BottomNavMorador />
    </div>
  );
}