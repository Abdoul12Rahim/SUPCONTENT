import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const ContentDetail = ({ route }) => {
    const { content } = route.params;

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: content.imageUrl }} style={styles.image} />
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.description}>{content.description}</Text>
            <Text style={styles.genres}>Genres: {content.genres.join(', ')}</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    description: {
        fontSize: 16,
        marginVertical: 4,
    },
    genres: {
        fontSize: 14,
        color: '#555',
    },
});

export default ContentDetail;