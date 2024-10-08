export interface friendResponse {
    friendId: number;
    friendUserId: number;
    nickname: string;
    userTag: number;
    profileImageUrl: string;
}

export interface friendRequestRequest {
    friendUserId: number;
    userId: number | undefined;
}

export interface friendRequest {
    friendId: number;
}