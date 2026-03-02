import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { fetchLikes, addLike } from '../../services/api';

const Likes = ({ contentId }) => {
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLikes = async () => {
            try {
                const response = await fetchLikes(contentId);
                setLikes(response.data);
            } catch (error) {
                console.error('Error fetching likes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLikes();
    }, [contentId]);

    const handleLike = async () => {
        try {
            await addLike(contentId);
            setLikes((prevLikes) => [...prevLikes, { contentId }]);
        } catch (error) {
            console.error('Error adding like:', error);
        }
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }

    return (
        <View>
            <Button title="Like" onPress={handleLike} />
            <FlatList
                data={likes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <Text>{item.user.name} liked this</Text>}
            />
        </View>
    );
};

export default Likes;