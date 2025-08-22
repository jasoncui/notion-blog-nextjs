import Head from "next/head";
import NavBar from "../components/navbar";

export default function Investing() {
  const investments = [
    {
      name: "Ramp",
      description: "Corporate cards and expense management",
      year: "2021",
      category: "Fintech",
    },
    {
      name: "Mercury",
      description: "Banking for startups",
      year: "2020",
      category: "Fintech",
    },
    {
      name: "Vercel",
      description: "Frontend cloud platform",
      year: "2021",
      category: "Developer Tools",
    },
    {
      name: "Linear",
      description: "Issue tracking for modern software teams",
      year: "2020",
      category: "Developer Tools",
    },
    {
      name: "Notion",
      description: "All-in-one workspace",
      year: "2019",
      category: "Productivity",
    },
    {
      name: "Figma",
      description: "Collaborative design platform",
      year: "2020",
      category: "Design Tools",
    },
    {
      name: "Stripe",
      description: "Payments infrastructure",
      year: "2019",
      category: "Fintech",
    },
    {
      name: "Airtable",
      description: "Low-code platform for building collaborative apps",
      year: "2020",
      category: "Productivity",
    },
    {
      name: "Superhuman",
      description: "Premium email client",
      year: "2021",
      category: "Productivity",
    },
    {
      name: "Replit",
      description: "Browser-based IDE and computing platform",
      year: "2021",
      category: "Developer Tools",
    },
  ];

  return (
    <div>
      <Head>
        <title>Investing - Jason Cui</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Investing - Jason Cui" />
        <meta
          property="og:description"
          content="Angel investing in early-stage technology companies"
        />
        <meta property="og:url" content="https://jasonscui.com/investing" />
        <meta property="og:image" content="/images/future-city.webp" />
      </Head>

      <main className="max-w-2xl mx-auto">
        <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32 px-4">
          <NavBar />
          
          <header>
            <h1 className="font-extrabold text-3xl mt-8 mb-8">Angel Investing</h1>
            
            <div className="space-y-5">
              <p className="leading-7">
                I'm an active angel investor focused on early-stage technology companies,
                particularly in developer tools, productivity software, and fintech. I look
                for exceptional founders building products that solve real problems with
                elegant solutions.
              </p>
              
              <p className="leading-7">
                My investing thesis centers around tools that empower creators and
                entrepreneurs to build and scale their businesses more efficiently. Having
                built Jemi from the ground up, I understand the challenges founders face
                and aim to provide not just capital but also strategic guidance and
                connections.
              </p>
              
              <p className="leading-7">
                I typically invest $10-50K checks in pre-seed and seed rounds, with a
                preference for B2B SaaS companies with strong product-market fit signals
                and exceptional design sensibilities.
              </p>
            </div>
          </header>

          <hr className="my-8" />

          <section>
            <h2 className="font-bold text-xl mt-4 mb-6">Portfolio Companies</h2>
            
            <div className="space-y-6">
              {investments.map((investment) => (
                <div key={investment.name} className="border-l-2 border-gray-200 pl-4 hover:border-gray-400 transition-colors">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold text-lg">{investment.name}</h3>
                    <span className="font-mono text-sm text-neutral-500 tracking-tighter">
                      {investment.year}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{investment.description}</p>
                  <span className="inline-block mt-2 text-xs font-mono uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {investment.category}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <hr className="my-8" />

          <section>
            <h2 className="font-bold text-xl mt-4 mb-4">Get in Touch</h2>
            <p className="leading-7">
              If you're building something interesting in the areas I focus on, I'd love
              to hear from you. The best way to reach me is through{" "}
              <a
                href="https://twitter.com/jasoncui"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Twitter/X
              </a>{" "}
              or{" "}
              <a
                href="https://linkedin.com/in/jasoncui"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                LinkedIn
              </a>
              . Please include a brief description of what you're building and why you
              think it's a good fit for my investment focus.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
  };
};