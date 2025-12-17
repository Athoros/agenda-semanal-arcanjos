export default async function handler(request, response) {
  // --- HARDCODED CONSTANTS ---
  // Copied from constants.ts to avoid import issues in Vercel Serverless environment
  const USERS = [
    { id: 1, name: 'André', avatarColor: 'bg-blue-500' },
    { id: 2, name: 'Jeremias', avatarColor: 'bg-green-500' },
    { id: 3, name: 'João', avatarColor: 'bg-yellow-500' },
    { id: 4, name: 'Matheus', avatarColor: 'bg-red-500' },
    { id: 5, name: 'Ryon', avatarColor: 'bg-purple-500' },
    { id: 6, name: 'Wander', avatarColor: 'bg-pink-500' },
  ];

  const DAYS_OF_WEEK = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
  ];

  const API_URL = 'https://api.npoint.io/ad63fecfda78b862f288';
  const HISTORY_API_URL = 'https://api.npoint.io/38a8d328af8a77a3247b';

  // --- HELPER FUNCTIONS ---

  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.

    // Calculate Monday
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(new Date(today).setDate(diffToMonday));

    // Calculate Friday
    const friday = new Date(new Date(monday).setDate(monday.getDate() + 4));

    const formatDate = (date) => {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };

    return `${formatDate(monday)} - ${formatDate(friday)}`;
  };

  const getEmptySchedule = () => {
    const emptySchedule = {};
    DAYS_OF_WEEK.forEach((day) => {
      emptySchedule[day] = [];
    });
    return emptySchedule;
  };

  // --- MAIN LOGIC ---

  // 1. Authenticate
  const { secret } = request.query;
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return response.status(401).json({ message: 'Unauthorized: Invalid or missing secret' });
  }

  try {
    // 2. Fetch current schedule
    const scheduleResponse = await fetch(API_URL, { cache: 'no-store' });
    if (!scheduleResponse.ok && scheduleResponse.status !== 404) {
      throw new Error(`Failed to fetch current schedule: ${scheduleResponse.statusText}`);
    }
    const currentSchedule = scheduleResponse.status === 404 ? getEmptySchedule() : await scheduleResponse.json();

    // 3. Fetch history data
    const historyResponse = await fetch(HISTORY_API_URL, { cache: 'no-store' });
    if (!historyResponse.ok && historyResponse.status !== 404) {
      throw new Error(`Failed to fetch history: ${historyResponse.statusText}`);
    }

    let historyData = { historico_agendamentos: [] };
    if (historyResponse.status !== 404) {
      const text = await historyResponse.text();
      if (text && text.trim() !== "" && text.trim() !== "{}") {
        historyData = JSON.parse(text);
        if (!historyData.historico_agendamentos) {
          historyData.historico_agendamentos = [];
        }
      }
    }

    // 4. Create new history entry
    const scheduleWithNames = {};
    DAYS_OF_WEEK.forEach((day) => {
      const userIds = currentSchedule[day] || [];
      scheduleWithNames[day] = userIds.map((id) => {
        const user = USERS.find((u) => u.id === id);
        return user ? user.name : `ID desconhecido: ${id}`;
      });
    });

    const newHistoryEntry = {
      semana: getWeekRange(),
      dados: scheduleWithNames,
    };

    historyData.historico_agendamentos.push(newHistoryEntry);

    // 5. Save updated history
    const saveHistoryResponse = await fetch(HISTORY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyData),
    });

    if (!saveHistoryResponse.ok) {
      throw new Error(`Failed to save history: ${await saveHistoryResponse.text()}`);
    }

    // 6. Create and save empty schedule (Reset)
    const emptySchedule = getEmptySchedule();
    const saveScheduleResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emptySchedule),
    });

    if (!saveScheduleResponse.ok) {
      throw new Error(`Failed to save new empty schedule: ${await saveScheduleResponse.text()}`);
    }

    // 7. Success
    return response.status(200).json({ message: 'Schedule reset successfully.' });

  } catch (error) {
    console.error('Cron job failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ message: 'Internal Server Error', error: errorMessage });
  }
}
