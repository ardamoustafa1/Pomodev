import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ModalProps
{
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
	showCloseButton?: boolean;
}

export default function ModalDialog({
	isOpen,
	onClose,
	title,
	description,
	children,
	className,
	showCloseButton = true
}: ModalProps)
{
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className={cn(
					"sm:max-w-[90%]",
					className
				)}
				showCloseButton={showCloseButton}
				onEscapeKeyDown={(e) => e.preventDefault()}
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				{children}
			</DialogContent>
		</Dialog>
	);
}