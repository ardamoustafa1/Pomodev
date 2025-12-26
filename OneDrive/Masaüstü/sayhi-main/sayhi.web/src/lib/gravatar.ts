const GRAVATAR_API_KEY = "6412:gk-Qsq_SsXunxakhG14IQ4Qof66NRU_wiVF0olN_eGZ5om5JzOB1l947rp3MO9-c";

async function getGravatarHash(email: string): Promise<string>
{
	const encoder = new TextEncoder();
	const data = encoder.encode(email.trim().toLowerCase());
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function getProfile(email: string): Promise<any>
{
	const hash = await getGravatarHash(email);
	const response = await fetch(`https://api.gravatar.com/v3/profiles/${hash}`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${GRAVATAR_API_KEY}`,
			"Content-Type": "application/json"
		}
	});
	const json = await response.json();
	return json;
}