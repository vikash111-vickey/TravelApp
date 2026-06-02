'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Mic, Sparkles, Languages, Info, MapPin, Database, Heart, Building, Train, Globe, Plane } from 'lucide-react';
import { Destination } from '../data/mockData';
import { constructDynamicDestination } from '../utils/dynamicDestination';
import { useTranslation, LanguageCode } from '../utils/translations';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  details?: {
    type: 'translate' | 'alert' | 'rec';
    title: string;
    items: string[];
  };
  offlineModelRating?: boolean;
}

interface FloatingChatProps {
  isOffline?: boolean;
  lang?: string;
}

export default function FloatingChat({ isOffline = false, lang = 'EN' }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hey there, fellow traveler! 👋 I'm your GOBRO buddy. Where are we heading next? Tell me, and let's craft an awesome plan together!",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation(lang as LanguageCode);

  useEffect(() => {
    if (isOffline) {
      setMessages(prev => [
        ...prev,
        {
          id: `offline-welcome-${Date.now()}`,
          text: "⚠️ Hey, just a heads-up! We've gone off-grid. No worries though, I'm running on-device via local model weights, so I've still got your back!",
          sender: 'assistant',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOffline]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const quickPrompts = [
    { text: "🥦 Safe Veg spots in Varanasi?", query: "veg spots varanasi" },
    { text: "🚆 Vande Bharat to Goa?", query: "vande bharat to goa" },
    { text: "❄️ Oxygen tips for Ladakh?", query: "oxygen levels in leh" },
    { text: "🗣️ Hindi greetings translation", query: "common hindi phrases" }
  ];

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "";
      let details: Message['details'];
      const query = text.toLowerCase().trim();

      // 1. Dynamic Destination NLP Matching Logic
      let matchedDest = null;
      const isGeneralCommand = query.includes('hello') || query.includes('hi ') || query.includes('help') || query.includes('who are') || query.includes('sattvik') || query.includes('veg') || query.includes('oxygen') || query.includes('altitude') || query.includes('cheap') || query.includes('spiritual') || query.includes('budget');
      
      if (!isGeneralCommand && query.length >= 3) {
        const inMatch = query.match(/(?:in|about|to|at|for|near|visit)\s+([a-zA-Z\s\-]{3,25})/i);
        let extractedName = inMatch ? inMatch[1].trim() : query;
        extractedName = extractedName.replace(/^(what is|where is|tell me about|show me|how to|hotels|stays|rooms|monuments|places to visit|activities)\s+/i, '').trim();
        if (extractedName.length >= 3 && extractedName !== 'you' && extractedName !== 'me') {
          const formattedName = extractedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          matchedDest = constructDynamicDestination(formattedName);
        }
      }

      if (matchedDest) {
        // Detailed intent detection for the matched destination
        if (query.includes('hotel') || query.includes('stay') || query.includes('sleep') || query.includes('resort') || query.includes('homestay') || query.includes('accommodation')) {
          replyText = `Looking for places to stay in **${matchedDest.name}**? 🏨 I've got you covered! Here are top integrated stays:`;
          details = {
            type: 'rec',
            title: `Stays in ${matchedDest.name}`,
            items: matchedDest.hotels.map(h => `${h.name} (${h.provider}) - Rating: ${h.rating}⭐ - price: ₹${h.price}/night`)
          };
        } else if (query.includes('activity') || query.includes('do') || query.includes('visit') || query.includes('tour') || query.includes('attraction') || query.includes('sight')) {
          replyText = `Here are some awesome things to do in **${matchedDest.name}**! 🧗 Make sure to add them to your planner:`;
          details = {
            type: 'rec',
            title: `Activities in ${matchedDest.name}`,
            items: matchedDest.activities.map(a => `${a.title} - price: ₹${a.price} via ${a.provider}`)
          };
        } else if (query.includes('visa') || query.includes('passport') || query.includes('entry') || query.includes('permit')) {
          if (matchedDest.isInternational) {
            replyText = `Planning to go to **${matchedDest.name}**? 🛂 Here are the visa guidelines for Indian passport holders:\n\n**${matchedDest.visaInfo}**`;
          } else {
            replyText = `**${matchedDest.name}** is in India! 🇮🇳 No passport or visa is required for Indian citizens. Just hop on a flight or train!`;
          }
        } else if (query.includes('flight') || query.includes('train') || query.includes('bus') || query.includes('reach') || query.includes('travel to')) {
          const transportItems: string[] = [];
          if (matchedDest.flights && matchedDest.flights.length > 0) {
            matchedDest.flights.forEach(f => transportItems.push(`✈️ Flight: ${f.airline} - price: ₹${f.price} (Duration: ${f.duration})`));
          }
          if (matchedDest.trains && matchedDest.trains.length > 0) {
            matchedDest.trains.forEach(t => transportItems.push(`🚆 Train: ${t.name} (${t.class}) - price: ₹${t.price}`));
          }
          if (transportItems.length === 0) {
            transportItems.push(`🚕 Taxis and local transit transfers are widely available for ${matchedDest.name}`);
          }
          
          replyText = `Here are the transit options to reach **${matchedDest.name}** that I synced for you:`;
          details = {
            type: 'rec',
            title: `Transit to ${matchedDest.name}`,
            items: transportItems
          };
        } else if (query.includes('currency') || query.includes('money') || query.includes('price') || query.includes('exchange') || query.includes('rate') || query.includes('cost')) {
          if (matchedDest.isInternational) {
            replyText = `The local currency in **${matchedDest.name}** is **${matchedDest.currency}**. Current simulated exchange rate: **${matchedDest.exchangeRate}**.`;
          } else {
            replyText = `**${matchedDest.name}** uses Indian Rupees (INR / ₹). Stays average around ₹${matchedDest.hotels[0]?.price || '2,000'}/night.`;
          }
        } else if (query.includes('weather') || query.includes('temp') || query.includes('temperature') || query.includes('climate') || query.includes('hot') || query.includes('cold')) {
          replyText = `Current local climate at **${matchedDest.name}** is **${matchedDest.temperature}**. \n\n🚨 Live telemetry bulletin: *"${matchedDest.pulseEvent}"*`;
        } else {
          // General lookup profile card response
          replyText = `Ah, **${matchedDest.name}**! 🌟 ${matchedDest.description}\n\nIt matches categories like ${matchedDest.archetypes.join(', ')}. The temperature is ${matchedDest.temperature} and current crowd level is **${matchedDest.crowdLevel}**. Try asking me about 'hotels in ${matchedDest.name}' or 'activities in ${matchedDest.name}'!`;
        }
      } 
      // 2. Veg Food Match
      else if (query.includes('veg') || query.includes('vegetarian') || query.includes('food') || query.includes('sattvik') || query.includes('eat')) {
        replyText = "Looking for pure vegetarian or Sattvik meals? 🍲 In Varanasi, the area near the Vishwanath corridor is absolute paradise for Sattvik food! If you are traveling internationally, Singapore, Dubai, and Bali have excellent veg/vegan establishments too!";
        details = {
          type: 'rec',
          title: 'Top Vegetarian-Friendly Spots',
          items: [
            'Keshari Sattvik Restaurant (Varanasi)',
            'Sri Annapurna Temple Free Mess (Varanasi)',
            'Gokul Vegetarian Diner (Singapore)',
            'Saravanaa Bhavan (Dubai Marina, UAE)'
          ]
        };
      }
      // 3. Train Match
      else if (query.includes('vande bharat') || query.includes('train')) {
        replyText = "Heading across the rails? 🚆 Vande Bharat Express routes are super comfortable and fast! You can check ticket times and booking options inside our Bookings tab.";
        details = {
          type: 'rec',
          title: 'Popular Rail Timings (IRCTC)',
          items: [
            'Vande Bharat Express (22436) - DEL to Varanasi - CC: ₹1,750',
            'Shiv Ganga Express (12560) - DEL to Varanasi - 3A: ₹1,100'
          ]
        };
      }
      // 4. Altitude Warning Match
      else if (query.includes('oxygen') || query.includes('altitude') || query.includes('leh') || query.includes('ladakh') || query.includes('sick')) {
        replyText = "Travelling to high altitudes like Leh-Ladakh (11,500 ft)? ❄️ Please take care! The oxygen levels are lower, so resting for the first 36-48 hours is critical. Avoid heavy walks, keep hydrated, and consult a doctor about Diamox.";
        details = {
          type: 'alert',
          title: 'High Altitude Protocol',
          items: [
            'Rest fully for the first 48 hours',
            'Avoid immediate ascents to Pangong Tso or Khardung La',
            'Drink 4-5 litres of water daily',
            'Keep portable oxygen cylinders handy'
          ]
        };
      }
      // 5. Local Phrases Match
      else if (query.includes('phrase') || query.includes('hindi') || query.includes('translation') || query.includes('translate') || query.includes('speak')) {
        replyText = "Greet the locals in their native tongue to make beautiful connections! Here are basic Hindi phrases:";
        details = {
          type: 'translate',
          title: 'Useful Local Greetings',
          items: [
            'Namaste (Hello / Greetings)',
            'Aap kaise hain? (How are you?)',
            'Yeh kitne ka hai? (How much is this?)',
            'Dhanyawad (Thank you)'
          ]
        };
      }
      // 6. Archetypes Lookup
      else if (query.includes('budget') || query.includes('cheap') || query.includes('value')) {
        replyText = "Looking for a budget-friendly escape? 💰 I recommend checking out **Varanasi**, **Hampi**, **Bangkok**, or **Hanoi**! Stays and activities there are extremely cost-effective.";
      } else if (query.includes('luxury') || query.includes('expensive') || query.includes('premium')) {
        replyText = "Ready to travel in absolute style? 👑 I suggest **Paris**, **Tokyo**, **Dubai**, **Switzerland**, or a private bungalow in **Maldives**! They offer top-tier hospitality and premium stays.";
      } else if (query.includes('spiritual') || query.includes('peace') || query.includes('temple')) {
        replyText = "Seeking spiritual roots or peace? 🧘 Explore the sacred ghats of **Varanasi**, the ancient stone temple complexes of **Hampi**, or the beautiful shrines of **Bali**.";
      } else if (query.includes('adventure') || query.includes('trek') || query.includes('rafting')) {
        replyText = "Thrill seeker! 🧗 Scale high mountain passes in **Leh-Ladakh**, go river rafting, or hike the snowy mountains of **Switzerland**!";
      } else if (query.includes('eco') || query.includes('green') || query.includes('sustainable')) {
        replyText = "Travel responsibly! 🍃 Stays in **Leh-Ladakh**, **Maldives**, and **Switzerland** have high eco sustainability ratings, focusing on organic gardens and low waste.";
      }
      // 7. General Greetings
      else if (/^(hi|hello|hey|greetings|yo|namaste|hola)(\s|$)/i.test(query)) {
        if (lang === 'HI') {
          replyText = "नमस्ते! आप कैसे हैं? आज हम किस सुंदर यात्रा की योजना बना रहे हैं? ✈️";
        } else if (lang === 'KN') {
          replyText = "ನಮಸ್ತೆ! ನೀವು ಹೇಗಿದ್ದೀರಾ? ಇಂದು ನಾವು ಯಾವ ಸುಂದರ ಪ್ರಯಾಣವನ್ನು ಯೋಜಿಸುತ್ತಿದ್ದೇವೆ? ✈️";
        } else {
          replyText = "Hey there! How is your day going? What exciting travel plans are we cooking up today? ✈️";
        }
      }
      // 8. Help / Capabilities
      else if (query.includes('help') || query.includes('what can you do') || query.includes('features')) {
        replyText = "I'm your GOBRO Buddy travel companion! 🌍 Since I run offline-first, I use client-side model parameters to help you with:";
        details = {
          type: 'rec',
          title: 'My Interactive Features',
          items: [
            'Destination lookup (e.g., "tell me about Tokyo")',
            'Stays and hotel search (e.g., "hotels in Hampi")',
            'Local activity finders (e.g., "things to do in Bali")',
            'Visa specifications (e.g., "visa for Paris")',
            'Transit modes (e.g., "flight to Singapore")',
            'Local currency and exchange rates',
            'Travel warnings & altitude guidelines',
            'Voice dictation dictaphone controls'
          ]
        };
      }
      // 9. Empathic Fallbacks
      else {
        const fallbacks = [
          "I'd love to help you plan that! Are we dreaming of a domestic getaway or looking to cross international borders? Let me know your vibe (spiritual, adventure, luxury, eco, or value)!",
          "That sounds like a great plan! What kind of experiences are you looking for? Stays, local street food, flight recommendations, or maybe visa requirements for an international spot?",
          "I'm on it! 🚀 Tell me: which country or city is on your bucket list right now? I can pull up local exchange rates, visa guides, and hotel details instantly.",
          "Fascinating! Feel free to ask me questions like: 'visa for Singapore', 'hotels in Varanasi', or tell me what style of travel (cheap, luxury, nature) you prefer!"
        ];
        replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        text: replyText,
        sender: 'assistant',
        timestamp: new Date(),
        details,
        offlineModelRating: isOffline
      }]);
      setIsTyping(false);
    }, 1200);
  };

  // Real Web Speech API microphone dictation
  const toggleVoiceInput = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = lang === 'HI' ? 'hi-IN' : lang === 'KN' ? 'kn-IN' : 'en-IN';
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setInputValue(speechToText);
          handleSendMessage(speechToText);
        };

        recognition.start();
      } else {
        // Fallback simulated dictation
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          handleSendMessage("tell me about Varanasi");
        }, 2200);
      }
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-velvet-rose to-saffron-radiance text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
        whileHover={{ rotate: 10 }}
      >
        <MessageSquare className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-radiance opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-saffron-radiance"></span>
        </span>
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] rounded-3xl border border-white/10 bg-midnight-obsidian/95 shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-velvet-rose to-saffron-radiance text-white">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1">
                    GOBRO Buddy <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
                  </h4>
                  <span className={`text-[10px] flex items-center gap-1 ${isOffline ? 'text-yellow-400' : 'text-green-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isOffline ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></span>
                    {isOffline ? 'Offline Local Mode' : 'Online Sync Active'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation Log */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-velvet-rose text-white rounded-br-none' 
                        : 'bg-white/5 border border-white/5 text-text-body rounded-bl-none'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.offlineModelRating && msg.sender === 'assistant' && (
                      <span className="mt-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[8px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 max-w-[155px]">
                        <Database className="h-2 w-2" /> Offline local model fallback
                      </span>
                    )}

                    {msg.details && (
                      <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-xs text-text-muted">
                        <h5 className="font-semibold text-white flex items-center gap-1">
                          {msg.details.type === 'translate' && <Languages className="h-3.5 w-3.5 text-saffron-radiance" />}
                          {msg.details.type === 'alert' && <Info className="h-3.5 w-3.5 text-rose-500 animate-pulse" />}
                          {msg.details.type === 'rec' && <MapPin className="h-3.5 w-3.5 text-green-400" />}
                          {msg.details.title}
                        </h5>
                        <ul className="list-disc pl-4 space-y-1 text-left">
                          {msg.details.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-text-muted mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-2 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 max-w-[80px]">
                  <span className="h-2 w-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}
            </div>

            {/* Listening HUD */}
            {isListening && (
              <div className="absolute inset-0 bg-midnight-obsidian/90 z-20 flex flex-col items-center justify-center space-y-4">
                <span className="text-xs font-bold text-white tracking-widest animate-pulse flex items-center gap-1">
                  <Mic className="h-4 w-4 text-red-500 animate-ping" /> LISTENING...
                </span>
                <div className="flex items-center space-x-1.5 h-12">
                  {[...Array(6)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-1 bg-gradient-to-t from-velvet-rose to-saffron-radiance rounded-full"
                      animate={{ height: [12, 48, 12] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-text-muted">Speak now e.g. "tell me about Dubai"</span>
              </div>
            )}

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Input */}
            <div className="p-3 bg-white/5 border-t border-white/10 flex items-center space-x-2">
              <button 
                onClick={toggleVoiceInput}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                title="Speak to co-pilot (Web Speech API)"
              >
                <Mic className="h-4.5 w-4.5 text-red-500" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Chat with your co-pilot..."
                className="flex-1 bg-black/25 text-xs text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-velvet-rose/50"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                className="p-2 rounded-xl bg-velvet-rose hover:bg-red-700 text-white transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
