import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16">
      <div className="max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl rounded-full"></div>
            <h1 className="relative text-5xl md:text-7xl font-bold text-foreground">
              SolsticeSwap
            </h1>
          </div>
          <p className="text-xl md:text-3xl text-foreground font-light max-w-2xl mx-auto">
            Privacy-Preserving Token Swap Platform
          </p>
          <p className="text-base md:text-lg text-foreground/90 max-w-xl mx-auto pt-4">
            Trade with complete privacy. All orders are fully encrypted on-chain, protecting you from front-running and MEV attacks.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="group p-6 bg-white rounded-2xl border-2 border-border/60 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/25 transition-all">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">Fully Encrypted</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              All order parameters are fully encrypted on-chain using FHEVM
            </p>
          </div>

          <div className="group p-6 bg-white rounded-2xl border-2 border-border/60 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-secondary/25 transition-all">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">MEV Protection</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Prevents front-running and price manipulation attacks
            </p>
          </div>

          <div className="group p-6 bg-white rounded-2xl border-2 border-border/60 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
            <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent/25 transition-all">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">Large Orders</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Iceberg orders protect large traders' strategy privacy
            </p>
          </div>

          <div className="group p-6 bg-white rounded-2xl border-2 border-border/60 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-warning/40">
            <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-warning/25 transition-all">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">Multiple Types</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Limit, Market, TWAP, and more advanced order types
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/swap"
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl font-semibold text-lg w-full sm:w-auto text-center"
          >
            Get Started
          </Link>
          <Link
            href="/orders"
            className="px-8 py-4 border-2 border-primary/30 bg-white rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all font-semibold text-lg text-foreground w-full sm:w-auto text-center shadow-sm hover:shadow-md"
          >
            View Orders
          </Link>
        </div>
      </div>
    </main>
  );
}


