import { Input, InputGroup, InputLeftElement, Icon, useColorModeValue } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ onSearch, placeholder = 'Rechercher un jeu...' }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const inputBg = useColorModeValue('white', 'gray.800');
  const inputText = useColorModeValue('gray.800', 'whiteAlpha.900');
  const inputBorder = useColorModeValue('gray.200', 'gray.700');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <InputGroup size="lg">
      <InputLeftElement pointerEvents="none">
        <Icon as={SearchIcon} color="gray.400" />
      </InputLeftElement>
      <Input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        bg={inputBg}
        color={inputText}
        borderColor={inputBorder}
        borderRadius="full"
        border="1px solid"
        _placeholder={{ color: placeholderColor }}
        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px rgba(124,58,237,0.8)' }}
      />
    </InputGroup>
  );
};
