import React, { useState, useRef, useEffect } from 'react';
import { openAIService } from '../services/openai_api';
import styled from 'styled-components';

// Styled components for the chat interface
const Container = styled.div`
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: #f5f5f5;
  padding: 20px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
`;

const Messages = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
`;

const Message = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  margin: 10px 0;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: ${props => props.isUser ? '#007bff' : '#e9ecef'};
  color: ${props => props.isUser ? 'white' : '#212529'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  word-wrap: break-word;
`;

const InputContainer = styled.div`
  padding: 20px;
  border-top: 1px solid #ddd;
  background-color: white;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 16px;
  outline: none;
  
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin: 10px 0;
  cursor: pointer;
  width: 100%;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const Label = styled.label`
  display: block;
  margin: 10px 0 5px;
  font-weight: 500;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
`;

const InputRange = styled.input`
  width: 100%;
  margin: 10px 0;
`;

const RangeValue = styled.span`
  display: inline-block;
  width: 40px;
  text-align: right;
  margin-left: 10px;
`;

const RangeContainer = styled.div`
  display: flex;
  align-items: center;
`;

// Message type
type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

const ExampleBot: React.FC = () => {
  // State for messages and input
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Configuration state
  const [config, setConfig] = useState({
    model: 'gpt-4.1-nano-2025-04-14',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    vectorStore: 'ALLWV',
    topK: 30,
    instructions: 'Você é um especialista em Conscienciologia. Responda com base nos arquivos da base de dados fornecida. Quando possível, inclua as fontes das informações fornecidas.',
    prePrompt: 'Quando possível, responda na forma de listagem numerada.',
  });
  
  // Generate a unique conversation ID
  const [conversationId] = useState(`conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Get available vector stores
  const vectorStores = openAIService.getAvailableVectorStores();
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Show welcome message on initial render
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      content: 'Hello! How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }]);
    
    // Clean up conversation when component unmounts
    return () => {
      openAIService.resetConversation(conversationId);
    };
  }, [conversationId]);
  
  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Show loading message
    const loadingMessageId = `loading-${Date.now()}`;
    setMessages(prev => [
      ...prev, 
      {
        id: loadingMessageId,
        content: '...',
        isUser: false,
        timestamp: new Date(),
      }
    ]);
    
    setIsLoading(true);
    
    try {
      // Call the OpenAI API
      const response = await openAIService.openaiCall({
        message: input,
        conversationId,
        ...config,
      });
      
      // Update messages with the AI response
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== loadingMessageId),
        {
          id: `ai-${Date.now()}`,
          content: response.content,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== loadingMessageId),
        {
          id: `error-${Date.now()}`,
          content: 'Sorry, there was an error processing your message. Please try again.',
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle configuration changes
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value,
    }));
  };
  
  // Format date to a readable time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container>
      <Sidebar>
        <h3>Settings</h3>
        
        <Label>Model</Label>
        <Select 
          name="model" 
          value={config.model}
          onChange={handleConfigChange}
          disabled={isLoading}
        >
          <option value="gpt-4.1-nano-2025-04-14">GPT-4.1 Nano</option>
          <option value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini</option>
          <option value="gpt-4.1-2025-04-14">GPT-4.1</option>
        </Select>
        
        <Label>Temperature: <RangeValue>{config.temperature.toFixed(1)}</RangeValue></Label>
        <RangeContainer>
          <InputRange
            type="range"
            name="temperature"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={handleConfigChange}
            disabled={isLoading}
          />
        </RangeContainer>
        
        <Label>Max Tokens: <RangeValue>{config.maxTokens}</RangeValue></Label>
        <RangeContainer>
          <InputRange
            type="range"
            name="maxTokens"
            min="100"
            max="4000"
            step="100"
            value={config.maxTokens}
            onChange={handleConfigChange}
            disabled={isLoading}
          />
        </RangeContainer>
        
        <Label>Top P: <RangeValue>{config.topP.toFixed(1)}</RangeValue></Label>
        <RangeContainer>
          <InputRange
            type="range"
            name="topP"
            min="0"
            max="1"
            step="0.1"
            value={config.topP}
            onChange={handleConfigChange}
            disabled={isLoading}
          />
        </RangeContainer>
        
        <Label>Vector Store</Label>
        <Select 
          name="vectorStore" 
          value={config.vectorStore}
          onChange={handleConfigChange}
          disabled={isLoading}
        >
          {vectorStores.map(store => (
            <option key={store} value={store}>{store}</option>
          ))}
        </Select>
        
        <Label>Top K: <RangeValue>{config.topK}</RangeValue></Label>
        <RangeContainer>
          <InputRange
            type="range"
            name="topK"
            min="1"
            max="100"
            step="1"
            value={config.topK}
            onChange={handleConfigChange}
            disabled={isLoading}
          />
        </RangeContainer>
        
        <Label>Instructions</Label>
        <textarea
          name="instructions"
          value={config.instructions}
          onChange={handleConfigChange}
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',
          }}
        />
        
        <Label>Pre-prompt</Label>
        <textarea
          name="prePrompt"
          value={config.prePrompt}
          onChange={handleConfigChange}
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',
          }}
          placeholder="Additional context for the model"
        />
        
        <Button 
          onClick={() => {
            if (window.confirm('Are you sure you want to reset the conversation? This will clear the chat history.')) {
              openAIService.resetConversation(conversationId);
              setMessages([{
                id: 'reset',
                content: 'Conversation has been reset. How can I help you?',
                isUser: false,
                timestamp: new Date(),
              }]);
            }
          }}
          disabled={isLoading}
        >
          Reset Conversation
        </Button>
      </Sidebar>
      
      <ChatContainer>
        <Messages>
          {messages.map(message => (
            <Message 
              key={message.id} 
              isUser={message.isUser}
              style={{
                opacity: message.content === '...' ? 0.7 : 1,
                fontStyle: message.content === '...' ? 'italic' : 'normal',
              }}
            >
              {message.content}
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.7,
                textAlign: 'right',
                marginTop: '4px',
              }}>
                {formatTime(message.timestamp)}
              </div>
            </Message>
          ))}
          <div ref={messagesEndRef} />
        </Messages>
        
        <form onSubmit={handleSendMessage}>
          <InputContainer>
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              autoFocus
            />
          </InputContainer>
        </form>
      </ChatContainer>
    </Container>
  );
};

export default ExampleBot;
