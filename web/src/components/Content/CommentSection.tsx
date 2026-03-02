import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  Textarea,
  useToast,
  Divider,
  IconButton,
  Collapse,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ChatIcon, ChevronDownIcon, ChevronUpIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reviewAPI } from '../../services/api';

interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  reviewId: string;
}

export const CommentSection = ({ reviewId }: CommentSectionProps) => {
  const { isAuthenticated, user } = useAuth();
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getComments(reviewId);
      setComments(response.data.comments || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, reviewId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le commentaire ne peut pas être vide',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      await reviewAPI.addComment(reviewId, newComment.trim());
      setNewComment('');
      toast({
        title: 'Commentaire ajouté',
        status: 'success',
        duration: 2000,
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'ajouter le commentaire',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId: string) => {
    if (!replyText.trim()) {
      toast({
        title: 'Erreur',
        description: 'La réponse ne peut pas être vide',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      await reviewAPI.addComment(reviewId, replyText.trim(), parentCommentId);
      setReplyText('');
      setReplyingTo(null);
      toast({
        title: 'Réponse ajoutée',
        status: 'success',
        duration: 2000,
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible d\'ajouter la réponse',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le commentaire ne peut pas être vide',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await reviewAPI.updateComment(commentId, editText.trim());
      toast({
        title: 'Commentaire modifié',
        status: 'success',
        duration: 2000,
      });
      setEditingCommentId(null);
      setEditText('');
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de modifier le commentaire',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }

    try {
      await reviewAPI.deleteComment(commentId);
      toast({
        title: 'Commentaire supprimé',
        status: 'success',
        duration: 2000,
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer le commentaire',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Compter tous les commentaires et réponses récursivement
  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countAllComments(comments);

  // Composant récursif pour afficher un commentaire et ses réponses
  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <Box>
      <HStack align="start" spacing={3}>
        <Avatar
          size={isReply ? 'xs' : 'sm'}
          name={comment.user.displayName || comment.user.username}
          src={comment.user.avatar}
        />
        <VStack align="start" spacing={1} flex={1}>
          <HStack justify="space-between" width="full">
            <HStack>
              <Text fontWeight="semibold" fontSize={isReply ? 'xs' : 'sm'}>
                {comment.user.displayName || comment.user.username}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatTimeAgo(comment.createdAt)}
              </Text>
            </HStack>
            {user && comment.user._id === user._id && (
              <HStack spacing={1}>
                <IconButton
                  aria-label="Modifier"
                  icon={<EditIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={() => handleEdit(comment)}
                />
                <IconButton
                  aria-label="Supprimer"
                  icon={<DeleteIcon />}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDelete(comment._id)}
                />
              </HStack>
            )}
          </HStack>
          {editingCommentId === comment._id ? (
            <VStack align="stretch" width="full" spacing={2}>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                size="sm"
                maxLength={500}
                rows={2}
              />
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">
                  {editText.length}/500
                </Text>
                <HStack>
                  <Button size="xs" variant="ghost" onClick={handleCancelEdit}>
                    Annuler
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={() => handleSaveEdit(comment._id)}
                    isDisabled={!editText.trim()}
                  >
                    Enregistrer
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          ) : (
            <>
              <Text fontSize={isReply ? 'xs' : 'sm'}>{comment.text}</Text>
              {isAuthenticated && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => setReplyingTo(comment._id)}
                >
                  Répondre
                </Button>
              )}
            </>
          )}
          
          {/* Formulaire de réponse */}
          {replyingTo === comment._id && (
            <VStack align="stretch" width="full" spacing={2} mt={2}>
              <Textarea
                placeholder="Votre réponse..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                size="sm"
                maxLength={500}
                rows={2}
                autoFocus
              />
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">
                  {replyText.length}/500
                </Text>
                <HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={() => handleReply(comment._id)}
                    isLoading={submitting}
                    isDisabled={!replyText.trim()}
                  >
                    Répondre
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          )}

          {/* Afficher les réponses de manière récursive */}
          {comment.replies && comment.replies.length > 0 && (
            <VStack align="stretch" spacing={3} pl={6} pt={3} width="full" borderLeftWidth={2} borderColor="gray.200">
              {comment.replies.map((reply) => (
                <CommentItem key={reply._id} comment={reply} isReply={true} />
              ))}
            </VStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );

  return (
    <Box>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<ChatIcon />}
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={onToggle}
      >
        Commentaires {totalComments > 0 && `(${totalComments})`}
      </Button>

      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" spacing={4} mt={4} pl={4}>
          {isAuthenticated && (
            <HStack align="start" spacing={3}>
              <Avatar
                size="sm"
                name={user?.displayName || user?.username}
                src={user?.avatar}
              />
              <VStack align="stretch" flex={1} spacing={2}>
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  size="sm"
                  maxLength={500}
                  rows={2}
                />
                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.500">
                    {newComment.length}/500
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    isDisabled={!newComment.trim()}
                  >
                    Commenter
                  </Button>
                </HStack>
              </VStack>
            </HStack>
          )}

          {!isAuthenticated && (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
              Connectez-vous pour commenter
            </Text>
          )}

          <Divider />

          {loading ? (
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Chargement...
            </Text>
          ) : comments.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
              Aucun commentaire pour le moment
            </Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {comments.map((comment) => (
                <CommentItem key={comment._id} comment={comment} />
              ))}
            </VStack>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};
