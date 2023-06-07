import React from "react";
import { Home, Linkedin, Instagram } from "feather-icons-react";

const NavBar = () => {
  return (
    <nav>
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div>
              <p className="text-lg font-semibold">Jason Cui</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-auto space-x-2">
              <a href="/">
                <Home className="text-gray-400 hover:text-gray-600 hover:cursor-pointer h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/jasonscui/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="text-gray-400 hover:text-gray-600 hover:cursor-pointer h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/jasonscui/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="text-gray-400 hover:text-gray-600 hover:cursor-pointer h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
