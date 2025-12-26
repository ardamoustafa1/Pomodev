import { Link } from "react-router-dom"

function Home()
{
    return (
        <div>
            <h1>Ana Sayfa</h1>
            <p>Bu, uygulamanın ana sayfasıdır.</p>
            <Link to="/hakkinda">Hakkımızda sayfasına git</Link>
        </div>
    );
}

export default Home;