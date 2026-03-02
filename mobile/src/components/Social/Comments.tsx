import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { fetchComments, addComment } from '../../services/api';

const Comments = ({ contentId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const loadComments = async () => {
            const fetchedComments = await fetchComments(contentId);
            setComments(fetchedComments);
        };

        loadComments();
    }, [contentId]);

    const handleAddComment = async () => {
        if (newComment.trim()) {
            await addComment(contentId, newComment);
            setNewComment('');
            const updatedComments = await fetchComments(contentId);
            setComments(updatedComments);
        }
    };

    return (
        <View>
            <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.user.name}: {item.text}</Text>
                    </View>
                )}
            />
            <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
            />
            <Button title="Submit" onPress={handleAddComment} />
        </View>
    );
};

export default Comments;