const Footer = () =>
{
    return (
        <footer className="mb-4 text-center text-sm text-gray-500">
            &copy; {(new Date()).getFullYear()} Say Hi!. All rights reserved.
        </footer>
    );
};

export default Footer;