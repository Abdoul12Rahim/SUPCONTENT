import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
} from '@chakra-ui/react';
import { useState } from 'react';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    visibility?: 'public' | 'private';
    tags?: string[];
  }) => Promise<void>;
}

const CreateListModal = ({ isOpen, onClose, onCreate }: CreateListModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        tags,
      });
      // Réinitialiser le formulaire
      setName('');
      setDescription('');
      setVisibility('private');
      setTags([]);
      setCurrentTag('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Créer une liste collaborative</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nom de la liste</FormLabel>
              <Input
                placeholder="Ma collection préférée..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Une description de votre liste..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Visibilité</FormLabel>
              <Select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              >
                <option value="private">Privée - Uniquement les membres invités</option>
                <option value="public">Publique - Visible par tous</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tags</FormLabel>
              <HStack>
                <Input
                  placeholder="Ajouter un tag..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button onClick={handleAddTag} isDisabled={!currentTag.trim()}>
                  Ajouter
                </Button>
              </HStack>
              {tags.length > 0 && (
                <Wrap mt={2}>
                  {tags.map((tag) => (
                    <Tag key={tag} colorScheme="teal" size="md">
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                    </Tag>
                  ))}
                </Wrap>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!name.trim()}
          >
            Créer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateListModal;
