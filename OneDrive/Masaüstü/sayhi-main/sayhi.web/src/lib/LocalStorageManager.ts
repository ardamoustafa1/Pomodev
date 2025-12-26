export default class LocalStorageManager
{
	static set<T>(key: string, value: T): boolean
	{
		try
		{
			const serializedValue = JSON.stringify(value);
			localStorage.setItem(key, serializedValue);
			return true;
		}
		catch (error)
		{
			console.error(`[LocalStorage] "${key}" anahtarına veri kaydederken hata oluştu:`, error);
			return false;
		}
	}

	static get<T>(key: string): T | null
	{
		try
		{
			const serializedValue = localStorage.getItem(key);

			if (serializedValue === null)
				return null;

			return JSON.parse(serializedValue) as T;
		}
		catch (error)
		{
			console.error(`[LocalStorage] "${key}" anahtarından veri okurken hata oluştu:`, error);
			return null;
		}
	}

	static remove(key: string): void
	{
		localStorage.removeItem(key);
	}

	static clear(): void
	{
		localStorage.clear();
	}
}