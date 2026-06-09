import { useMemo, useState } from 'react';

interface LikeEntry {
    userId: string;
}

interface LikesProps {
    contentId: string;
    userId: string;
    initialLikes?: LikeEntry[];
}

const Likes = ({ contentId, userId, initialLikes = [] }: LikesProps) => {
    const [likes, setLikes] = useState<LikeEntry[]>(initialLikes);

    const isLiked = useMemo(
        () => likes.some((like) => like.userId === userId),
        [likes, userId]
    );

    const handleLike = () => {
        if (isLiked) {
            setLikes(likes.filter((like) => like.userId !== userId));
            return;
        }

        setLikes([...likes, { userId }]);
    };

    return (
        <div data-content-id={contentId}>
            <button onClick={handleLike}>{isLiked ? 'Unlike' : 'Like'}</button>
            <p>
                {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
            </p>
        </div>
    );
};

export default Likes;