import React, { useEffect, useState } from 'react';
import { fetchLikes, addLike, removeLike } from '../../services/api';

const Likes = ({ contentId, userId }) => {
    const [likes, setLikes] = useState([]);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const loadLikes = async () => {
            const fetchedLikes = await fetchLikes(contentId);
            setLikes(fetchedLikes);
            setIsLiked(fetchedLikes.some(like => like.userId === userId));
        };

        loadLikes();
    }, [contentId, userId]);

    const handleLike = async () => {
        if (isLiked) {
            await removeLike(contentId, userId);
            setLikes(likes.filter(like => like.userId !== userId));
        } else {
            await addLike(contentId, userId);
            setLikes([...likes, { userId }]);
        }
        setIsLiked(!isLiked);
    };

    return (
        <div>
            <button onClick={handleLike}>
                {isLiked ? 'Unlike' : 'Like'}
            </button>
            <p>{likes.length} {likes.length === 1 ? 'Like' : 'Likes'}</p>
        </div>
    );
};

export default Likes;