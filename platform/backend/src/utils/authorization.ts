export function isOwner(resourceOwnerId: string, userId: string): boolean {
	return resourceOwnerId === userId;
}