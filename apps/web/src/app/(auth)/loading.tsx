export default function AuthLoading() {
 return (
 <div className="w-full max-w-[440px] flex flex-col items-center justify-center animate-pulse px-4 py-8">
 <div className="w-12 h-12 rounded-2xl bg-surface-container-highest mb-4" />
 <div className="h-6 w-48 bg-surface-container-highest rounded-lg mb-2" />
 <div className="h-4 w-64 bg-surface-container rounded-lg mb-6" />
 <div className="w-full h-80 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl" />
 </div>
 );
}

