const Footer = () => {
  return (
    <footer className="border-t border-white/5 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-2">
            Developed by <span className="text-white font-semibold">Aryan Gupta</span>
          </p>
          <p className="text-text-secondary text-sm flex-col gap-2">
            Contact: <a href="mailto:ag8080677@gmail.com" className="text-accent hover:text-accent-hover transition-colors">ag8080677@gmail.com</a>
          </p>
           <p className="text-text-secondary text-sm mt-2">
            LinkedIn:{" "}
            <a
              href="https://www.linkedin.com/in/aryan-gupta-8080677/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover transition-colors"
            >
              Aryan Gupta
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
