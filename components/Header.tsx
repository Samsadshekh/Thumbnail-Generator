
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-brand-dark-light shadow-md">
            <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-center">
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-wider">
                    <span className="text-brand-purple">AI</span> Thumbnail Generator
                </h1>
            </div>
        </header>
    );
};

export default Header;
