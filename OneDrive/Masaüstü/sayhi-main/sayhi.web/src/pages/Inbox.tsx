import Chat from "../components/chat/Chat"

export default function Inbox()
{
    /*    
    const applyCachedAvatars = (chatList: Chat[], avatarMap: Record<string, string>): Chat[] =>
    {
        return chatList.map(chat => ({
            ...chat,
            //participants: chat.participants.map(participant =>
            //{
            //    const avatar = avatarMap[participant.email];
            //    return avatar ? { ...participant, avatar } : participant;
            //})
            participantMap: new Map<string, ChatParticipant>(chat
                .participants
                .map(participant =>
                {
                    const avatar = avatarMap[participant.email];
                    return [participant.id, avatar ? { ...participant, avatar } : participant];
                }))
        }));
    };

    const getEmailsWithoutAvatar = (chats: Chat[], avatarMap: Record<string, string>): string[] =>
    {
        const emails = chats
            .flatMap(chat => chat.participants)
            //.flatMap(chat => Array.from(chat.participantMap.values()))
            .map(participant => participant.email)
            .filter(email => !avatarMap[email]);

        return Array.from(new Set(emails));
    }
    */

    return (
        <Chat />
    );
}
