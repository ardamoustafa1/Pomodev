import { useState, useCallback, useRef } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function useDialog(initialTitle: string, initialDescription: string, buttons: string[])
{
	const [visible, setVisible] = useState(false);
	const [title, setTitle] = useState(initialTitle);
	const [description, setDescription] = useState(initialDescription);
	const resolveRef = useRef<(value: boolean) => void>(_ => { });

	const show = useCallback((): Promise<boolean> =>
	{
		return new Promise((resolve) =>
		{
			setVisible(true);
			resolveRef.current = resolve;
		});
	}, []);

	const handleConfirm = useCallback(() =>
	{
		setVisible(false);
		resolveRef.current(true);
	}, []);

	const handleCancel = useCallback(() =>
	{
		setVisible(false);
		resolveRef.current(false);
	}, []);

	const Dialog = useCallback(() => (
		<AlertDialog open={visible} onOpenChange={setVisible}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction onClick={handleConfirm}>
						{buttons[0]}
					</AlertDialogAction>
					<AlertDialogCancel onClick={handleCancel}>
						{buttons[1]}
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	), [visible, handleConfirm, handleCancel]);

	return {
		show,
		set title(value: string)
		{
			setTitle(value);
		},
		set description(value: string)
		{
			setDescription(value);
		},
		Dialog
	};
}