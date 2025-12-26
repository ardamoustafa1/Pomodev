import LocalStorageManager from "./LocalStorageManager";
import { type User } from "./Models";

/*
interface Dictionary<T>
{
	[Key: string]: T;
}
*/

/*
function useLocalStorage<T>(key: string, initialValue: T)
{
    const [value, setValue] = useState<T>(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
    });
    
    useEffect(() =>
	{
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    
    return [value, setValue] as const; // Tuple type
}

// Kullanım
const [name, setName] = useLocalStorage<string>("name", "Ali");
*/

class StorageItem<T>
{
	private key: string;
	constructor(key: string)
	{
		this.key = key;
	}

	get(): T | null
	{
		return LocalStorageManager.get<T>(this.key);
	}

	set(value: T): void
	{
		LocalStorageManager.set<T>(this.key, value);
	}

	delete(): void
	{
		LocalStorageManager.remove(this.key);
	}
}
const AVATAR_MAP_KEY = "AvatarMap";
const TOKEN_KEY = "Token";
const USER_KEY = "User";
const PREFERENCES_KEY = "Preferences";

const storage = {
	AvatarMap: new StorageItem<Record<string, string>>(AVATAR_MAP_KEY),
	Token: new StorageItem<string>(TOKEN_KEY),
	User: new StorageItem<User>(USER_KEY),
	Preferences: new StorageItem<Record<string, any>>(PREFERENCES_KEY)
	//Settings: new StorageItem<{ theme: string }>("Settings")
};

export default storage;