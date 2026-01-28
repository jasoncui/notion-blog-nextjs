import React from "react";
import { Home, Linkedin, Instagram } from "feather-icons-react";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
  return (
    <nav>
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div>
              <a className="text-lg font-semibold" href="/">
                Jason Cui
              </a>
            </div>
          </div>
          <div className="">
            <div className="ml-4 flex items-center md:ml-auto space-x-2">
              <a href="/">
                <Home className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/jasonscui/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/jasonscui/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:cursor-pointer h-5 w-5" />
              </a>
              <span className="border-l border-gray-300 dark:border-gray-600 h-5" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
