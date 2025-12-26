import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessagesSquareIcon } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faWhatsapp, faTwitterSquare, faInstagram, faFacebook, faTelegram } from "@fortawesome/free-brands-svg-icons"
import { type Chat } from "../../lib/Models"
import { isGroupChat } from "../../lib/utils"

const sourceIcons: Record<string, React.ReactNode> = {
	chat: <div className="size-6 p-1 border-2 bg-yellow-100 border-white rounded-full">
		<MessagesSquareIcon className="size-full" />
	</div>,
	whatsapp: <FontAwesomeIcon icon={faWhatsapp} className="text-green-500 border-2 bg-white border-white rounded-full" />, // <FontAwesomeIcon icon={faWhatsappSquare} className="text-green-500" />,
	twitter: <FontAwesomeIcon icon={faTwitterSquare} className="text-blue-500 border-2 bg-white border-white rounded-full" />,//<FontAwesomeIcon icon={faTwitter} className="text-blue-500" />,
	instagram: <FontAwesomeIcon icon={faInstagram} className="text-red-500 border-2 bg-white border-white rounded-full" />, //<FontAwesomeIcon icon={faInstagramSquare} className="text-pink-500" />
	facebook: <FontAwesomeIcon icon={faFacebook} className="text-blue-700 border-2 bg-white border-white rounded-full" />, //<FontAwesomeIcon icon={faFacebookF} className="text-blue-700" />, //<FontAwesomeIcon icon={faFacebookSquare} className="text-blue-700" />, // <FontAwesomeIcon icon={faFacebookMessenger} className="text-blue-700" />,
	telegram: <FontAwesomeIcon icon={faTelegram} className="text-blue-400 border-2 bg-white border-white rounded-full" />
};

const AvatarX = ({ image, fallback }: { image: string; fallback: string; }) => (
	<Avatar>
		<AvatarImage src={image} alt={fallback} />
		<AvatarFallback>{fallback}</AvatarFallback>
	</Avatar>);

const ChatAvatar = ({ chat }: { chat?: Chat }) =>
{
	if (chat != null)
	{
		//const participants = Array.from(chat.participantMap.values());
		//Array.from( chat.participantMap ).map(([id, participant]) => ({ id, participant }))

		return (
			<div className="relative">
				{isGroupChat(chat)
					? (<div className="*:data-[slot=avatar]:ring-background flex -space-x-6 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
						{chat.participants.map(p =>
							(<AvatarX key={p.name} image={p.avatar} fallback={p.name[0]} />))}
					</div>)
					: (<AvatarX image={chat.participants[0].avatar} fallback={chat.participants[0].name[0]} />)}
				{chat.participants[0].isOnline && (
					<span className="absolute -top-1 -right-1 m-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
				)}
				<span className="absolute bottom-0 right-0 w-3 h-3 ">
					{sourceIcons[chat.source]}
				</span>
			</div>
		);
	}
	else
	{
		return (
			<Avatar>
				<AvatarImage />
				<AvatarFallback></AvatarFallback>
			</Avatar>
		);
	}
};

export default ChatAvatar;