import React, { useState, useEffect, useRef } from "react";

// This interface defines the structure for a single chat message.
interface Message {
  sender: "user" | "nenrin";
  content: string;
  timestamp: string;
}

// --- CONVERSATIONS (30 Examples in 3 Languages) ---

// English Conversations
const convEN1: Message[] = [ { sender: "user", content: "Remind me to drink water in 1 hour.", timestamp: "3:11 PM" }, { sender: "nenrin", content: "Of course! 💧 Reminder set for an hour from now.", timestamp: "3:11 PM" }];
const convEN2: Message[] = [ { sender: "nenrin", content: "Reminder: Time to drink some water! 💧", timestamp: "4:11 PM" }, { sender: "user", content: "Thanks, Nenrin!", timestamp: "4:11 PM" }];
const convEN3: Message[] = [ { sender: "user", content: "Add 'Finish quarterly report' to my to-do list.", timestamp: "1:20 PM" }, { sender: "nenrin", content: "Added to your tasks! 🎁 Let's get it done.", timestamp: "1:20 PM" }];
const convEN4: Message[] = [ { sender: "user", content: "What's a simple recipe for pancakes?", timestamp: "8:30 AM" }, { sender: "nenrin", content: "You'll need flour, eggs, milk, and sugar. Want the full recipe? 🥞", timestamp: "8:30 AM" }];
const convEN5: Message[] = [ { sender: "user", content: "From now on, call me 'The Boss'.", timestamp: "9:00 AM" }, { sender: "nenrin", content: "Yes, The Boss! 🫡 How can I assist you?", timestamp: "9:00 AM" }];
const convEN6: Message[] = [ { sender: "user", content: "Remind me to join the weekly sync every Friday at 10 AM.", timestamp: "9:05 AM" }, { sender: "nenrin", content: "Got it! Recurring reminder for the weekly sync is set. ✅", timestamp: "9:05 AM" }];
const convEN7: Message[] = [ { sender: "user", content: "I want to learn to code, where do I start?", timestamp: "1:30 PM" }, { sender: "nenrin", content: "Starting with Python or JavaScript is a great idea. I can find you some tutorials! 💻", timestamp: "1:30 PM" }];
const convEN8: Message[] = [ { sender: "user", content: "Journal: Today's meeting was very productive.", timestamp: "5:00 PM" }, { sender: "nenrin", content: "Noted in your journal! 📝", timestamp: "5:00 PM" }];
const convEN9: Message[] = [ { sender: "user", content: "What's the capital of Nepal?", timestamp: "11:00 AM" }, { sender: "nenrin", content: "The capital of Nepal is Kathmandu! 🏔️", timestamp: "11:00 AM" }];
const convEN10: Message[] = [ { sender: "user", content: "Summarize my tasks for today.", timestamp: "9:00 AM" }, { sender: "nenrin", content: "Today's tasks: 'Finish quarterly report'. Anything else, The Boss? 🫡", timestamp: "9:01 AM" }];

// Indonesian Conversations
const convID1: Message[] = [ { sender: "user", content: "Ingatkan saya untuk sholat Ashar.", timestamp: "3:15 PM" }, { sender: "nenrin", content: "Tentu! Pengingat sholat Ashar sudah diatur. 🙏", timestamp: "3:15 PM" }];
const convID2: Message[] = [ { sender: "nenrin", content: "Pengingat: Sudah masuk waktu sholat Ashar. 🙏", timestamp: "3:30 PM" }, { sender: "user", content: "Terima kasih, Nenrin.", timestamp: "3:30 PM" }];
const convID3: Message[] = [ { sender: "user", content: "todo: Beli kado untuk ulang tahun Ibu.", timestamp: "10:00 AM" }, { sender: "nenrin", content: "Sudah masuk daftar tugas! 🎁 Jangan sampai lupa ya.", timestamp: "10:00 AM" }];
const convID4: Message[] = [ { sender: "user", content: "Bagaimana cuaca di Bandung besok?", timestamp: "8:00 PM" }, { sender: "nenrin", content: "Besok di Bandung diperkirakan cerah berawan dengan suhu sekitar 24°C. 🌤️", timestamp: "8:00 PM" }];
const convID5: Message[] = [ { sender: "user", content: "Simpan alamat Dinda: Jalan Kenari nomor 12.", timestamp: "11:30 AM" }, { sender: "nenrin", content: "Oke, alamat Dinda sudah disimpan! 👍", timestamp: "11:30 AM" }];
const convID6: Message[] = [ { sender: "user", content: "Rekomendasi film horor Indonesia dong.", timestamp: "9:00 PM" }, { sender: "nenrin", content: "'Pengabdi Setan' sangat direkomendasikan! Mau info lebih lanjut? 👻", timestamp: "9:00 PM" }];
const convID7: Message[] = [ { sender: "user", content: "Resep nasi goreng spesial?", timestamp: "6:00 PM" }, { sender: "nenrin", content: "Tentu! Anda butuh nasi, telur, bawang, dan kecap manis. Mau resep lengkapnya? �", timestamp: "6:00 PM" }];
const convID8: Message[] = [ { sender: "user", content: "Berita terbaru hari ini apa?", timestamp: "7:00 AM" }, { sender: "nenrin", content: "Ada beberapa berita utama tentang ekonomi dan olahraga. Tertarik topik tertentu? 📰", timestamp: "7:00 AM" }];
const convID9: Message[] = [ { sender: "user", content: "Mulai sekarang, bicaralah lebih formal.", timestamp: "1:00 PM" }, { sender: "nenrin", content: "Baik, permintaan Anda telah diterima. Saya akan berkomunikasi dengan lebih formal.", timestamp: "1:00 PM" }];
const convID10: Message[] = [ { sender: "user", content: "Rangkum semua tugasku untuk hari ini.", timestamp: "8:00 AM" }, { sender: "nenrin", content: "Tugas Anda hari ini: 'Beli kado untuk ulang tahun Ibu'.", timestamp: "8:01 AM" }];

// Spanish Conversations
const convES1: Message[] = [ { sender: "user", content: "Recuérdame llamar a mi abuela a las 7pm.", timestamp: "6:00 PM" }, { sender: "nenrin", content: "¡Claro! Recordatorio para llamar a la abuela a las 7pm. 👵", timestamp: "6:00 PM" }];
const convES2: Message[] = [ { sender: "nenrin", content: "Recordatorio: ¡Es hora de llamar a la abuela! 👵", timestamp: "7:00 PM" }, { sender: "user", content: "¡Gracias, Nenrin!", timestamp: "7:00 PM" }];
const convES3: Message[] = [ { sender: "user", content: "Añade 'estudiar español' a mis tareas.", timestamp: "10:00 AM" }, { sender: "nenrin", content: "¡Añadido! ¡Vamos a aprender! 📚", timestamp: "10:00 AM" }];
const convES4: Message[] = [ { sender: "user", content: "¿Qué significa 'nostalgia'?", timestamp: "4:00 PM" }, { sender: "nenrin", content: "Nostalgia es un sentimiento de anhelo por un tiempo pasado. ✨", timestamp: "4:00 PM" }];
const convES5: Message[] = [ { sender: "user", content: "Diario: Hoy soñé que podía volar.", timestamp: "8:00 AM" }, { sender: "nenrin", content: "¡Qué sueño increíble! Guardado en tu diario. 🕊️", timestamp: "8:00 AM" }];
const convES6: Message[] = [ { sender: "user", content: "Dime un dato curioso.", timestamp: "12:00 PM" }, { sender: "nenrin", content: "¿Sabías que los pulpos tienen tres corazones? 🐙", timestamp: "12:00 PM" }];
const convES7: Message[] = [ { sender: "user", content: "Recuérdame el cumpleaños de mamá cada 15 de mayo.", timestamp: "2:00 PM" }, { sender: "nenrin", content: "¡Hecho! Recordatorio anual para el 15 de mayo. 🎂", timestamp: "2:00 PM" }];
const convES8: Message[] = [ { sender: "user", content: "Receta simple de gazpacho.", timestamp: "1:00 PM" }, { sender: "nenrin", content: "Necesitarás tomates, pimientos, pepino y ajo. ¿Quieres la receta completa? 🍅", timestamp: "1:00 PM" }];
const convES9: Message[] = [ { sender: "user", content: "¿Quién pintó la Mona Lisa?", timestamp: "5:00 PM" }, { sender: "nenrin", content: "La Mona Lisa fue pintada por Leonardo da Vinci. 🎨", timestamp: "5:00 PM" }];
const convES10: Message[] = [ { sender: "user", content: "Resume mis tareas para mañana.", timestamp: "9:00 PM" }, { sender: "nenrin", content: "Para mañana tienes: 'estudiar español'. ¡Que tengas un día productivo! 📚", timestamp: "9:01 PM" }];


const allConversations = [
  convEN1, convEN2, convEN3, convEN4, convEN5, convEN6, convEN7, convEN8, convEN9, convEN10,
  convID1, convID2, convID3, convID4, convID5, convID6, convID7, convID8, convID9, convID10,
  convES1, convES2, convES3, convES4, convES5, convES6, convES7, convES8, convES9, convES10
];
const allTitles = [
  "Simple Reminder", "Reminder Delivery", "To-Do List", "Recipe Search", "Set Personality",
  "Recurring Reminder", "Expert Guidance", "Journaling", "General Knowledge", "Task Summary",
  "Pengingat Sholat", "Pengingat Terkirim", "Daftar Tugas", "Cek Cuaca", "Simpan Alamat",
  "Rekomendasi Film", "Resep Masakan", "Berita Terbaru", "Ubah Kepribadian", "Rangkuman Tugas",
  "Recordatorio Simple", "Entrega de Recordatorio", "Lista de Tareas", "Definición de Palabra", "Diario de Sueños",
  "Dato Curioso", "Recordatorio Recurrente", "Receta Simple", "Evento Histórico", "Resumen de Tareas"
];

// A reusable PhoneMockup component that animates a given conversation.
function PhoneMockup({ conversation, title }: { conversation: Message[], title: string }) {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate conversation pairs (user + nenrin)
    const timer = setTimeout(() => {
      setCurrentMessages(conversation);
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversation]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentMessages]);


  return (
    <div className="w-80 mx-auto">
      <div className="bg-black rounded-3xl p-2 shadow-xl">
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="bg-[#1F5E42] px-6 py-4 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 40 40" width={20} height={20}>
                <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeWidth="3"/>
                <circle cx="20" cy="20" r="12" fill="none" stroke="white" strokeWidth="2.5" opacity=".6"/>
                <circle cx="20" cy="20" r="6"  fill="none" stroke="white" strokeWidth="2" opacity=".4"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-white/80 text-xs">Nenrin Assistant</p>
            </div>
          </div>
          <div ref={chatContainerRef} className="bg-[#F4F6F5] p-4 h-96 overflow-y-auto flex flex-col">
            <div className="space-y-2 mt-auto">
              {currentMessages.map((message, index) => (
                <div key={index}>
                  <p className={`text-xs text-gray-500 mb-1 ${message.sender === 'user' ? 'text-right mr-3' : 'ml-3'}`}>
                    {message.sender === 'user' ? 'User' : 'Nenrin'}
                  </p>
                  <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${ message.sender === "user" ? "bg-green-200 text-gray-800" : "bg-white border border-gray-200 text-gray-800" }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">{message.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The main component for the chat demonstration, now showing a single phone that cycles conversations.
export default function ChatDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // This interval will cycle through the conversations.
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % allConversations.length);
    }, 4000); // Cycle every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PhoneMockup 
        key={currentIndex} // Using key to force re-mount and restart animation
        conversation={allConversations[currentIndex]} 
        title={allTitles[currentIndex]} 
      />
    </div>
  );
}
�