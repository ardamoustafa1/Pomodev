import { useState, useEffect } from "react"
import { PhoneIcon, PhoneOffIcon, UserIcon, MessageCircleIcon, XIcon } from "lucide-react"
import { cn } from "../lib/utils"
import { type InteractionInfo } from "../lib/Models"
import { useChats } from "../lib/chatContext"
import ModalDialog from "./ModalDialog"

export default function RingingDialog({ isVisible, setIsVisible, interaction }: {
	isVisible: boolean;
	setIsVisible: (isVisible: boolean) => void;
	interaction?: InteractionInfo
})
{
	const [ripples, setRipples] = useState([0, 1, 2]);
	//const { chats, chatStore } = useChats();
	const { chatStore } = useChats();

	useEffect(() =>
	{
		const interval = setInterval(() =>
		{
			setRipples(prev => prev.map(r => (r + 1) % 3));
		}, 1500);
		return () => clearInterval(interval);
	}, []);

	const isVoiceCall = false;
	//const profileClasses = isVoiceCall ? "from-blue-500 to-blue-700" : "from-green-500 to-green-700";
	const profileClasses = isVoiceCall ? "from-blue-300 to-blue-500" : "from-green-300 to-green-500";
	const ProfileIcon = isVoiceCall ? UserIcon : MessageCircleIcon;
	const AcceptIcon = isVoiceCall ? PhoneIcon : MessageCircleIcon;
	const DeclineIcon = isVoiceCall ? PhoneOffIcon : XIcon;

	const incoming = isVoiceCall ? "Gelen arama..." : "Gelen mesaj...";
	// className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white p-16"

	const handleAccept = () =>
	{
		setIsVisible(false);
		if (interaction)
		{
			chatStore.answer(interaction);
		}
	};

	const handleDecline = () =>
	{
		setIsVisible(false);
		if (interaction)
		{
			chatStore.hangup(interaction);
		}
	};

	return (
		<ModalDialog
			className="sm:max-w-md bg-gradient-to-br from-slate-200 to-slate-100 border-white text-black px-16 pb-16 pt-2"
			isOpen={isVisible}
			onClose={() => setIsVisible(false)}
			title=" "
			description=" "
			showCloseButton={false}>
			<div className="flex flex-col items-center space-y-8">
				{/* Arayan profil resmi ve animasyonlar */}
				<div className="relative">
					{/* Dalgalanan halkalar */}
					{ripples.map((ripple, index) => (
						<div
							key={index}
							className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"
							style={{
								animationDelay: `${ripple * 0.5}s`,
								animationDuration: "1.5s"
							}} />
					))}

					{/* Profil resmi */}
					<div className={cn(profileClasses, "relative w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl")}>
						<ProfileIcon className="w-16 h-16 text-white" />
					</div>
				</div>

				{/* Arayan bilgisi */}
				<div className="text-center space-y-2">
					<h2 className="text-2xl font-semibold">{interaction?.name}</h2>
					<p className="text-slate-400 animate-pulse">{incoming}</p>
				</div>

				{isVoiceCall
					? <p className="text-slate-900 text-lg">{interaction?.phone}</p>
					: <div className="bg-slate-200 rounded-lg p-4 max-w-xs">
						<p className="text-slate-900 text-sm">
							"{interaction?.message}"
						</p>
					</div>}

				{/* Aksiyon butonları */}
				<div className="flex gap-8 pt-4">
					{/* Kabul et butonu */}
					<button
						onClick={() => handleAccept()}
						className="group relative"
						aria-label="Aramayı kabul et">
						<div className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-pulse">
							<AcceptIcon className="w-8 h-8 text-white" />
						</div>
						<span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-slate-400 whitespace-nowrap">
							Kabul Et
						</span>
					</button>

					{/* Reddet butonu */}
					<button
						onClick={() => handleDecline()}
						className="group relative"
						aria-label="Aramayı reddet">
						<div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95">
							<DeclineIcon className="w-8 h-8 text-white" />
						</div>
						<span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-slate-400 whitespace-nowrap">
							Reddet
						</span>
					</button>
				</div>
			</div>
		</ModalDialog>
	);
}