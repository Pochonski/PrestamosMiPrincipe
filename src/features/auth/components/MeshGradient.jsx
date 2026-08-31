export function MeshGradient({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className || ''}`}
    >
      <div
        className="absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-60 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)',
          animation: 'mesh-float-1 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #3B0764 0%, transparent 70%)',
          animation: 'mesh-float-2 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #0F172A 0%, transparent 70%)',
          animation: 'mesh-float-3 25s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes mesh-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, 40px) scale(1.1); }
          66% { transform: translate(-40px, 80px) scale(0.95); }
        }
        @keyframes mesh-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-80px, -60px) scale(1.15); }
        }
        @keyframes mesh-float-3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -50px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}