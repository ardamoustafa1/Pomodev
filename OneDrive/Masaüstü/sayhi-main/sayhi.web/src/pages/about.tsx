import { Link } from "react-router-dom"

export default function About()
{
    return (
        <div>
            <h1>Hakkında</h1>
            <p>Bu, uygulamanın hakkında sayfasıdır.</p>
            <Link to="/">Ana sayfaya git</Link>
        </div>
    );
}