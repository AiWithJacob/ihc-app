import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";

// Godziny 06:00-23:00 (wszystkie dostępne)
const HOURS = Array.from({ length: 18 }, (_, i) => {
  const hour = 6 + i;
  return `${hour.toString().padStart(2, "0")}:00`;
});

// Godziny wyświetlane w kalendarzu (06:00-22:00)
const HOURS_DISPLAYED = HOURS.slice(0, 17); // Wszystkie oprócz 23:00

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Funkcja do pobrania dni tygodnia dla wybranej daty
function getWeekDays(dateString) {
  const date = new Date(dateString + "T12:00:00"); // Używamy południa, aby uniknąć problemów z timezone
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.getFullYear(), date.getMonth(), diff);
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = String(d.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${dayNum}`);
  }
  return days;
}

// Formatowanie nazwy dnia
function formatDayName(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const month = date.getMonth() + 1;
  return { dayName, dayNum, month };
}

// Formatowanie nazwy miesiąca
function formatMonthName(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const months = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];
  return months[date.getMonth()];
}

export default function CalendarPage({ bookings, setBookings, leads, setLeads }) {
  const { themeData, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const leadFromState = location.state?.lead || null;
  const highlightBookingId = location.state?.highlightBookingId || null;
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [viewMode, setViewMode] = useState('week'); // 'week' lub 'single'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedBooking, setEditedBooking] = useState(null);
  const [showFullDescriptionModal, setShowFullDescriptionModal] = useState(false);
  const [showFullPatientInfoModal, setShowFullPatientInfoModal] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showMonthPickerInModal, setShowMonthPickerInModal] = useState(false);
  const [showYearPickerInModal, setShowYearPickerInModal] = useState(false);
  const [showTimeFromPicker, setShowTimeFromPicker] = useState(false);
  const [showTimeToPicker, setShowTimeToPicker] = useState(false);
  const timeFromPickerRef = useRef(null);
  const timeToPickerRef = useRef(null);
  const [showDatePickerInEdit, setShowDatePickerInEdit] = useState(false);
  const [showTimeFromPickerInEdit, setShowTimeFromPickerInEdit] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showTimeToPickerInEdit, setShowTimeToPickerInEdit] = useState(false);
  const [showMonthPickerInEdit, setShowMonthPickerInEdit] = useState(false);
  const [showYearPickerInEdit, setShowYearPickerInEdit] = useState(false);
  const [datePickerViewDateForEdit, setDatePickerViewDateForEdit] = useState(() => todayISO());
  const [newEventData, setNewEventData] = useState({
    date: "",
    timeFrom: "",
    description: "",
  });
  const [datePickerViewDateForModal, setDatePickerViewDateForModal] = useState(() => todayISO());
  const [datePickerViewDate, setDatePickerViewDate] = useState(() => todayISO());
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    };
  });
  const [draggedBooking, setDraggedBooking] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [showChangeNotification, setShowChangeNotification] = useState(false);
  const [changeNotificationData, setChangeNotificationData] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);

  // Aktualizuj czas co sekundę
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime({
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Automatycznie oznaczaj minione rezerwacje jako "completed"
  useEffect(() => {
    if (!bookings || bookings.length === 0 || !setBookings) return;

    const checkAndUpdateBookings = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayISO = new Date().toISOString().slice(0, 10);

      // Sprawdź wszystkie rezerwacje
      const bookingsToUpdate = bookings.filter(booking => {
        // Tylko rezerwacje ze statusem 'scheduled' (sprawdź też undefined/null jako domyślny)
        const bookingStatus = booking.status || 'scheduled';
        if (bookingStatus !== 'scheduled') return false;

        // Parsuj datę i godzinę rezerwacji
        const bookingDate = booking.date;
        if (!bookingDate) return false;

        const timePart = booking.time?.split(" - ")[0] || booking.time || booking.time_from || '';
        
        if (!timePart) return false;

        const [bookingHour, bookingMinute] = timePart.split(":").map(Number);
        
        if (isNaN(bookingHour) || isNaN(bookingMinute)) return false;

        // Sprawdź czy rezerwacja jest w przeszłości
        if (bookingDate < todayISO) {
          // Rezerwacja z przeszłości - automatycznie oznacz jako completed
          console.log(`🕐 Znaleziono rezerwację z przeszłości: ${bookingDate} ${timePart} (booking ID: ${booking.id})`);
          return true;
        } else if (bookingDate === todayISO) {
          // Rezerwacja dzisiaj - sprawdź czy minęła następna godzina
          // Jeśli currentHour > bookingHour (przeszła następna pełna godzina)
          // Np. booking 20:00, currentHour 21:00 → 21 > 20 = true
          if (currentHour > bookingHour) {
            console.log(`🕐 Znaleziono rezerwację która minęła: ${bookingDate} ${timePart} (booking ID: ${booking.id}, teraz: ${currentHour}:${String(currentMinute).padStart(2, '0')})`);
            return true;
          }
        }

        return false;
      });

      // Zaktualizuj status dla wszystkich znalezionych rezerwacji
      if (bookingsToUpdate.length > 0) {
        console.log(`📋 Znaleziono ${bookingsToUpdate.length} rezerwacji do automatycznego oznaczenia jako completed`);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const API_URL = import.meta.env.VITE_API_URL || 
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                          ? 'https://ihc-app.vercel.app'
                          : window.location.origin);

        // Zaktualizuj lokalnie
        setBookings((prev) =>
          prev.map((b) => {
            const shouldUpdate = bookingsToUpdate.some(btu => btu.id === b.id);
            const currentStatus = b.status || 'scheduled';
            if (shouldUpdate && currentStatus === 'scheduled') {
              console.log(`✅ Lokalna aktualizacja: booking ${b.id} zmieniony z '${currentStatus}' na 'completed'`);
              return { ...b, status: 'completed' };
            }
            return b;
          })
        );

        // Zaktualizuj w Supabase dla każdej rezerwacji
        bookingsToUpdate.forEach(async (booking) => {
          try {
            if (user.chiropractor && booking.id) {
              const timeFrom = booking.time?.split(" - ")[0] || booking.time || booking.time_from || '';
              
              console.log(`🔄 Aktualizuję booking ${booking.id} w Supabase...`);
              
              const response = await fetch(`${API_URL}/api/bookings?id=${booking.id}&chiropractor=${encodeURIComponent(user.chiropractor)}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...booking,
                  status: 'completed',
                  chiropractor: user.chiropractor,
                  timeFrom: timeFrom,
                  date: booking.date,
                  // Kontekst użytkownika dla audit log
                  user_id: user.id,
                  user_login: user.login,
                  user_email: user.email,
                  source: 'auto' // Oznacz jako automatyczna zmiana
                })
              });

              if (response.ok) {
                const data = await response.json();
                console.log(`✅ Automatycznie oznaczono rezerwację ${booking.id} jako completed w Supabase`, data);
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ Błąd automatycznego oznaczania rezerwacji ${booking.id}:`, response.status, response.statusText, errorData);
              }
            }
          } catch (error) {
            console.error(`❌ Błąd automatycznego oznaczania rezerwacji ${booking.id}:`, error.message);
          }
        });
      }
    };

    // Sprawdź od razu
    checkAndUpdateBookings();

    // Sprawdzaj co minutę (60000 ms), aby automatycznie oznaczać minione rezerwacje
    const interval = setInterval(checkAndUpdateBookings, 60000);

    return () => clearInterval(interval);
  }, [bookings, setBookings]); // Uruchamiaj przy każdej zmianie bookings

  // Funkcja do obliczania pozycji paska zbliżającej się godziny (nieużywana, ale zachowana dla przyszłego użycia)
  // eslint-disable-next-line no-unused-vars
  const getUpcomingTimePosition = () => {
    if (!currentTime || currentTime.hours === undefined || currentTime.minutes === undefined) {
      return null;
    }
    
    const weekDays = getWeekDays(selectedDate);
    const todayDate = todayISO();
    const isTodayInView = weekDays.includes(todayDate);
    if (!isTodayInView) return null;

    const currentHour = currentTime.hours;
    const currentMinute = currentTime.minutes;
    
    // Sprawdź czy aktualna godzina jest w zakresie 06:00-22:00
    if (currentHour < 6 || currentHour > 22) return null;

    // Znajdź najbliższą rezerwację w ciągu następnych 2 godzin
    const upcomingBookings = bookings.filter(booking => {
      if (booking.date !== todayDate) return false;
      const timePart = booking.time.split(" - ")[0];
      const [bookingHour, bookingMinute] = timePart.split(":").map(Number);
      const bookingTime = bookingHour * 60 + bookingMinute;
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const timeDiff = bookingTime - currentTimeMinutes;
      return timeDiff > 0 && timeDiff <= 120; // W ciągu 2 godzin
    });

    if (upcomingBookings.length === 0) return null;

    // Znajdź najbliższą rezerwację
    const nearestBooking = upcomingBookings.reduce((nearest, booking) => {
      const nearestTimePart = nearest.time.split(" - ")[0];
      const bookingTimePart = booking.time.split(" - ")[0];
      const [nearestHour, nearestMinute] = nearestTimePart.split(":").map(Number);
      const [bookingHour, bookingMinute] = bookingTimePart.split(":").map(Number);
      const nearestTime = nearestHour * 60 + nearestMinute;
      const bookingTime = bookingHour * 60 + bookingMinute;
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      return (bookingTime - currentTimeMinutes) < (nearestTime - currentTimeMinutes) ? booking : nearest;
    });

    const bookingTimePart = nearestBooking.time.split(" - ")[0];
    const [bookingHour, bookingMinute] = bookingTimePart.split(":").map(Number);
    const hourIndex = bookingHour - 6;
    const cellHeight = 100;
    const positionFromTop = (hourIndex * cellHeight) + (bookingMinute / 60) * cellHeight;

    const todayIndex = weekDays.indexOf(todayDate);
    if (todayIndex === -1) return null;

    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const bookingTimeMinutes = bookingHour * 60 + bookingMinute;
    const minutesUntil = bookingTimeMinutes - currentTimeMinutes;

    return {
      top: positionFromTop,
      hour: bookingHour,
      minute: bookingMinute,
      todayIndex: todayIndex,
      minutesUntil: minutesUntil,
      booking: nearestBooking,
    };
  };


  const months = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  const currentYear = new Date(selectedDate + "T00:00:00").getFullYear();
  const currentMonth = new Date(selectedDate + "T00:00:00").getMonth();
  
  const weekDays = viewMode === 'week' ? getWeekDays(selectedDate) : [];

  const selectMonth = (monthIndex) => {
    // Tworzymy datę w lokalnej strefie czasowej, aby uniknąć problemów z timezone
    const newDate = new Date(currentYear, monthIndex, 15); // Używamy 15, aby być w środku miesiąca
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = "15";
    const dateString = `${year}-${month}-${day}`;
    setSelectedDate(dateString);
    setShowMonthPicker(false);
  };

  const getBooking = (date, time) => {
    const result = bookings.find((b) => b.date === date && b.time === time);
    if (time === "22:00") {
      console.log("getBooking for 22:00, date:", date, "bookings:", bookings, "result:", result);
    }
    return result;
  };

  // Funkcja do sprawdzania, czy w danej komórce jest wydarzenie
  const getBookingsForCell = (date, time) => {
    return bookings.filter((b) => {
      if (b.date !== date) return false;
      
      // Parsuj czas wydarzenia (może być "10:00" lub "10:00 - 11:30")
      const timeParts = b.time.split(" - ");
      const startTime = timeParts[0];
      const endTime = timeParts[1] || startTime;
      
      // Sprawdź, czy dana godzina mieści się w zakresie wydarzenia
      const cellTime = time;
      return cellTime >= startTime && cellTime <= endTime;
    });
  };

  // Funkcje obsługi drag and drop
  const handleBookingDragStart = (e, booking) => {
    e.stopPropagation();
    setDraggedBooking(booking);
    setIsDragging(true);
    setDragPosition({ x: e.clientX, y: e.clientY });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", booking.id.toString());
    // Ustaw pusty drag image, żeby użyć naszego własnego elementu
    const emptyImg = document.createElement("img");
    emptyImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
    
    // Ukryj scrollbar podczas przeciągania i zablokuj scrollowanie strony
    const calendarContainer = scrollContainerRef.current;
    if (calendarContainer) {
      calendarContainer.style.scrollbarWidth = 'none';
      calendarContainer.style.msOverflowStyle = 'none';
      
      // Zapisz oryginalne style overflow dla strony
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Dodaj obsługę wheel bezpośrednio na kontenerze kalendarza i na całym dokumencie
      const wheelHandler = (wheelEvent) => {
        wheelEvent.preventDefault();
        wheelEvent.stopPropagation();
        // Zawsze scrolluj kalendarz, nawet jeśli mysz jest poza nim
        if (calendarContainer) {
          calendarContainer.scrollBy({ top: wheelEvent.deltaY, behavior: 'auto' });
        }
      };
      calendarContainer.addEventListener('wheel', wheelHandler, { passive: false });
      document.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
      window.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
      // Zapisz handler, żeby móc go usunąć później
      calendarContainer.__dragWheelHandler = wheelHandler;
    }
  };

  // Obsługa poruszania myszką podczas przeciągania z auto-scrollowaniem
  useEffect(() => {
    let scrollInterval = null;
    const SCROLL_SPEED = 20; // Szybkość scrollowania
    const DAY_THRESHOLD = 120; // Odległość od dolnej krawędzi dnia w px (około 2 godzin)

    const checkAndScroll = (e) => {
      if (!isDragging || !draggedBooking) return;
      
      const calendarContainer = scrollContainerRef.current;
      if (!calendarContainer) return;
      
      const containerRect = calendarContainer.getBoundingClientRect();
      const mouseY = e.clientY;
      
      // Sprawdź czy mysz jest w obszarze kalendarza (lub kontynuuj scroll nawet gdy poza)
      const mouseInCalendar = mouseY >= containerRect.top && mouseY <= containerRect.bottom;
      
      // Znajdź kolumny dni w widoku tygodniowym
      const dayColumns = calendarContainer.querySelectorAll('[style*="flex: 1"][style*="flexDirection: column"]');
      
      let shouldScrollDown = false;
      let shouldScrollUp = false;
      
      // Sprawdź czy mysz jest nad którąś kolumną dnia
      for (const dayColumn of dayColumns) {
        const rect = dayColumn.getBoundingClientRect();
        const mouseX = e.clientX;
        
        // Sprawdź czy mysz jest w obszarze tej kolumny lub blisko niej
        if (mouseX >= rect.left - 50 && mouseX <= rect.right + 50) {
          // Jeśli mysz jest poza kalendarzem, użyj ostatniej znanej pozycji Y względem kontenera
          let relativeY;
          if (mouseInCalendar) {
            relativeY = mouseY - rect.top;
          } else {
            // Gdy mysz jest poza kalendarzem, kontynuuj scroll w tym samym kierunku
            relativeY = mouseY < containerRect.top ? 0 : rect.height;
          }
          
          const columnHeight = rect.height;
          const distanceFromBottom = columnHeight - relativeY;
          
          // Auto-scroll w dół gdy mysz jest blisko dolnej krawędzi dnia lub poza kalendarzem poniżej
          if ((distanceFromBottom < DAY_THRESHOLD && distanceFromBottom > 0) || 
              (!mouseInCalendar && mouseY > containerRect.bottom)) {
            shouldScrollDown = true;
            break;
          }
          
          // Auto-scroll w górę gdy mysz jest blisko górnej krawędzi dnia lub poza kalendarzem powyżej
          if ((relativeY < DAY_THRESHOLD && relativeY > 0) || 
              (!mouseInCalendar && mouseY < containerRect.top)) {
            shouldScrollUp = true;
            break;
          }
        }
      }
      
      // Zatrzymaj poprzedni interval jeśli istnieje
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
      
      // Rozpocznij auto-scroll w odpowiednim kierunku
      if (shouldScrollDown) {
        scrollInterval = setInterval(() => {
          const maxScroll = calendarContainer.scrollHeight - calendarContainer.clientHeight;
          if (calendarContainer.scrollTop < maxScroll) {
            calendarContainer.scrollBy({ top: SCROLL_SPEED, behavior: 'auto' });
          } else {
            if (scrollInterval) {
              clearInterval(scrollInterval);
              scrollInterval = null;
            }
          }
        }, 16); // ~60fps
      } else if (shouldScrollUp) {
        scrollInterval = setInterval(() => {
          if (calendarContainer.scrollTop > 0) {
            calendarContainer.scrollBy({ top: -SCROLL_SPEED, behavior: 'auto' });
          } else {
            if (scrollInterval) {
              clearInterval(scrollInterval);
              scrollInterval = null;
            }
          }
        }, 16); // ~60fps
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging && draggedBooking) {
        setDragPosition({ x: e.clientX, y: e.clientY });
        checkAndScroll(e);
      }
    };

    const handleDragOver = (e) => {
      if (isDragging && draggedBooking) {
        e.preventDefault();
        setDragPosition({ x: e.clientX, y: e.clientY });
        checkAndScroll(e);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('dragover', handleDragOver, true);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('dragover', handleDragOver, true);
        if (scrollInterval) {
          clearInterval(scrollInterval);
        }
      };
    }
  }, [isDragging, draggedBooking]);

  const handleBookingDragEnd = (e) => {
    e.stopPropagation();
    setDraggedBooking(null);
    setDragOverCell(null);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    
    // Przywróć scrollbar i odblokuj scrollowanie strony
    const calendarContainer = scrollContainerRef.current;
    if (calendarContainer) {
      calendarContainer.style.scrollbarWidth = '';
      calendarContainer.style.msOverflowStyle = '';
      
      // Przywróć oryginalne style overflow dla strony
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Usuń obsługę wheel z kontenera kalendarza i dokumentu
      if (calendarContainer.__dragWheelHandler) {
        calendarContainer.removeEventListener('wheel', calendarContainer.__dragWheelHandler);
        document.removeEventListener('wheel', calendarContainer.__dragWheelHandler, { capture: true });
        window.removeEventListener('wheel', calendarContainer.__dragWheelHandler, { capture: true });
        delete calendarContainer.__dragWheelHandler;
      }
    }
  };

  const handleCellDragOver = (e, date, time) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell({ date, time });
    // Aktualizuj pozycję ghost elementu
    if (isDragging && draggedBooking) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCellDragLeave = (e) => {
    e.stopPropagation();
    // Nie czyść dragOverCell natychmiast, żeby uniknąć migotania
  };

  const handleCellDrop = async (e, targetDate, targetTime) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Natychmiast ukryj ghost element
    setIsDragging(false);
    
    if (!draggedBooking) {
      setDraggedBooking(null);
      setDragOverCell(null);
      setDragPosition({ x: 0, y: 0 });
      return;
    }

    const oldDate = draggedBooking.date;
    const oldTime = draggedBooking.time?.split(" - ")[0] || draggedBooking.time;
    
    // Sprawdź czy data lub czas się zmieniły
    if (oldDate === targetDate && oldTime === targetTime) {
      setDraggedBooking(null);
      setDragOverCell(null);
      setDragPosition({ x: 0, y: 0 });
      return;
    }

    // Zaktualizuj booking lokalnie
    const updatedBooking = {
      ...draggedBooking,
      date: targetDate,
      time: targetTime,
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === draggedBooking.id ? updatedBooking : b))
    );

    // Pokaż powiadomienie o zmianie
    setChangeNotificationData({
      name: updatedBooking.name || updatedBooking.description || "Wydarzenie",
      oldDate,
      oldTime,
      newDate: targetDate,
      newTime: targetTime,
    });
    setShowChangeNotification(true);
    setTimeout(() => setShowChangeNotification(false), 4000);

    // Zaktualizuj w Supabase i Google Calendar
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.chiropractor && draggedBooking.id) {
        const API_URL = import.meta.env.VITE_API_URL || 
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                          ? 'https://ihc-app.vercel.app'
                          : window.location.origin);
        
        const response = await fetch(`${API_URL}/api/bookings?id=${draggedBooking.id}&chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updatedBooking,
            chiropractor: user.chiropractor,
            timeFrom: targetTime,
            // Kontekst użytkownika dla audit log
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            source: 'ui'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Rezerwacja zaktualizowana (przez przeciągnięcie):', data.booking?.id);
          
          // Jeśli booking miał Google Calendar event ID, zaktualizuj w Google Calendar
          if (updatedBooking.google_calendar_event_id || draggedBooking.google_calendar_event_id) {
            try {
              const { updateCalendarEvent } = await import('../api/google-calendar.js');
              await updateCalendarEvent(
                updatedBooking.google_calendar_event_id || draggedBooking.google_calendar_event_id,
                updatedBooking,
                user.chiropractor
              );
              console.log('✅ Wydarzenie zaktualizowane w Google Calendar');
            } catch (calendarError) {
              console.error('❌ Błąd aktualizacji w Google Calendar:', calendarError.message);
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Błąd aktualizacji rezerwacji (przez przeciągnięcie):', response.statusText, errorData);
        }
      }
    } catch (error) {
      console.error('❌ Błąd aktualizacji rezerwacji (przez przeciągnięcie):', error.message);
    }

    // Zaktualizuj selectedBooking jeśli to był ten booking
    if (selectedBooking && selectedBooking.id === draggedBooking.id) {
      setSelectedBooking(updatedBooking);
    }

    // Wyczyść stan przeciągania
    setDraggedBooking(null);
    setDragOverCell(null);
    setDragPosition({ x: 0, y: 0 });
  };

  const handleCellClick = (date, time) => {
    // Jeśli przeciągamy booking, nie otwieraj modala
    if (draggedBooking) return;
    
    console.log("handleCellClick called:", date, time);
    // Sprawdź zarówno dokładne dopasowanie, jak i zakres czasowy
    const exactBooking = getBooking(date, time);
    const cellBookings = getBookingsForCell(date, time);
    console.log("Exact booking for", date, time, ":", exactBooking);
    console.log("Cell bookings for", date, time, ":", cellBookings);
    
    // Jeśli jest dokładne dopasowanie, pokaż szczegóły
    // Jeśli jest booking w zakresie, ale nie dokładne dopasowanie, też pokaż szczegóły pierwszego
    const existing = exactBooking || (cellBookings.length > 0 ? cellBookings[0] : null);

    if (existing) {
      console.log("Found existing booking, showing details");
      // Pokaż szczegóły
      setSelectedBooking(existing);
    } else {
      console.log("No existing booking, opening add event modal");
      // Otwórz modal do dodawania wydarzenia z automatycznie ustawioną datą i godziną "od"
      setNewEventData({
        date,
        timeFrom: time,
        description: "",
      });
      setDatePickerViewDateForModal(date);
      console.log("Setting showAddEventModal to true");
      setShowAddEventModal(true);
      console.log("showAddEventModal should now be true");
    }
  };

  const addEvent = async () => {
    if (!newEventData.date || !newEventData.timeFrom) {
      alert("Wypełnij datę i godzinę");
      return;
    }

    const timeDisplay = newEventData.timeFrom;

    const newBooking = {
      id: Date.now(),
      date: newEventData.date,
      time: timeDisplay,
      name: leadFromState ? leadFromState.name : (newEventData.description || "Wydarzenie"),
      phone: leadFromState ? leadFromState.phone : "",
      description: newEventData.description,
      leadId: leadFromState ? leadFromState.id : null,
    };

    setBookings((prev) => [...prev, newBooking]);
    
    // Zapisz do Supabase
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.chiropractor) {
        const API_URL = import.meta.env.VITE_API_URL || 
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                          ? 'https://ihc-app.vercel.app'
                          : window.location.origin);
        
        const response = await fetch(`${API_URL}/api/bookings?chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newBooking,
            chiropractor: user.chiropractor,
            timeFrom: timeDisplay,
            // Kontekst użytkownika dla audit log
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            source: 'ui'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Rezerwacja zapisana w Supabase:', data.booking?.name);
          // Zaktualizuj ID z bazy danych
          if (data.booking?.id) {
            setBookings((prev) => 
              prev.map(b => b.id === newBooking.id ? { ...b, id: data.booking.id } : b)
            );
          }
        } else {
          console.error('❌ Błąd zapisywania rezerwacji w Supabase:', response.statusText);
        }
      }
    } catch (error) {
      console.error('❌ Błąd zapisywania rezerwacji w Supabase:', error.message);
    }
    
    // Automatycznie zmień status leada na "Umówiony", jeśli wizyta jest powiązana z leadem
    if (leadFromState && leadFromState.id) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadFromState.id ? { ...l, status: "Umówiony" } : l
        )
      );
    }
    
    setShowAddEventModal(false);
    setShowDatePicker(false);
    setShowMonthPickerInModal(false);
    setShowYearPickerInModal(false);
    setShowTimeFromPicker(false);
    setShowTimeToPicker(false);
    setNewEventData({ date: "", timeFrom: "", description: "" });
    
    // Wyczyść stan rezerwacji (banner "Rezerwujesz: ...")
    if (leadFromState) {
      navigate("/calendar", { replace: true, state: {} });
    }
  };

  // Efekt do podświetlania wydarzenia po przejściu z LeadsPage
  useEffect(() => {
    if (highlightBookingId) {
      // Znajdź booking
      const booking = bookings.find(b => b.id === highlightBookingId);
      if (booking) {
        // Ustaw datę na datę booking (używamy setTimeout aby uniknąć setState w useEffect)
        setTimeout(() => {
          setSelectedDate(booking.date);
        }, 0);
        // Podświetl wydarzenie (błysk na zielono)
        setTimeout(() => {
          setHighlightedBookingId(highlightBookingId);
        }, 0);
        // Po 2 sekundach usuń podświetlenie
        setTimeout(() => {
          setHighlightedBookingId(null);
        }, 2000);
        // Wyczyść state w URL
        navigate("/calendar", { replace: true, state: {} });
      }
    }
  }, [highlightBookingId, bookings, navigate]);

  // Automatyczne przewijanie do wybranej godziny w selektorze czasu
  useEffect(() => {
    if (showTimeFromPicker && timeFromPickerRef.current) {
      setTimeout(() => {
        // Przewiń do końca, aby pokazać ostatnią godzinę
        if (timeFromPickerRef.current) {
          // Znajdź ostatni przycisk
          const buttons = timeFromPickerRef.current.querySelectorAll('button[data-time]');
          const lastButton = buttons[buttons.length - 1];
          if (lastButton) {
            lastButton.scrollIntoView({ behavior: "smooth", block: "end" });
            // Dodatkowo przewiń kontener do końca
            setTimeout(() => {
              if (timeFromPickerRef.current) {
                timeFromPickerRef.current.scrollTop = timeFromPickerRef.current.scrollHeight;
              }
            }, 100);
          } else {
            // Jeśli nie znaleziono, przewiń do końca
            timeFromPickerRef.current.scrollTop = timeFromPickerRef.current.scrollHeight;
          }
        }
        // Jeśli jest wybrana godzina, przewiń do niej
        if (newEventData.timeFrom) {
          const buttons = timeFromPickerRef.current?.querySelectorAll('button[data-time]');
          const selectedButton = Array.from(buttons || []).find(btn => btn.getAttribute('data-time') === newEventData.timeFrom);
          if (selectedButton) {
            selectedButton.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 300);
    }
  }, [showTimeFromPicker, newEventData.timeFrom]);

  useEffect(() => {
    if (showTimeToPicker && timeToPickerRef.current && newEventData.timeTo) {
      setTimeout(() => {
        const buttons = timeToPickerRef.current?.querySelectorAll('button');
        const selectedButton = Array.from(buttons || []).find(btn => btn.textContent === newEventData.timeTo);
        if (selectedButton) {
          selectedButton.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [showTimeToPicker, newEventData.timeTo]);

  // Automatycznie zmień status leadów na "Umówiony", jeśli mają wizytę w kalendarzu
  useEffect(() => {
    if (!leads || !bookings || !setLeads) return;
    
    // Znajdź wszystkie leady, które mają wizytę w kalendarzu
    const leadsWithBookings = leads.filter(lead => 
      bookings.some(booking => booking.leadId === lead.id)
    );
    
    // Zmień status na "Umówiony" dla leadów, które mają wizytę, ale nie mają statusu "Umówiony"
    leadsWithBookings.forEach(lead => {
      if (lead.status !== "Umówiony") {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id ? { ...l, status: "Umówiony" } : l
          )
        );
      }
    });
  }, [bookings, leads, setLeads]);

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Usunąć tę wizytę?")) return;
    
    // Usuń z Supabase dla wszystkich bookingów z ID
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.chiropractor && bookingId) {
        const API_URL = import.meta.env.VITE_API_URL || 
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                          ? 'https://ihc-app.vercel.app'
                          : window.location.origin);
        
        const response = await fetch(`${API_URL}/api/bookings?id=${bookingId}&chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Kontekst użytkownika dla audit log
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            chiropractor: user.chiropractor,
            source: 'ui'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Rezerwacja usunięta z Supabase:', data.message);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Błąd usuwania rezerwacji z Supabase:', response.statusText, errorData);
        }
      }
    } catch (error) {
      console.error('❌ Błąd usuwania rezerwacji z Supabase:', error.message);
    }
    
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setSelectedBooking(null);
    setEditMode(false);
    setEditedBooking(null);
  };

  const startEdit = () => {
    if (!selectedBooking) return;
    
    // Parsuj czas (może być "10:00" lub "10:00 - 11:30")
    const timeParts = selectedBooking.time.split(" - ");
    const timeFrom = timeParts[0];
    
    setEditedBooking({
      date: selectedBooking.date,
      timeFrom: timeFrom,
      name: selectedBooking.name || "",
      phone: selectedBooking.phone || "",
      description: selectedBooking.description || "",
    });
    setDatePickerViewDateForEdit(selectedBooking.date);
    setEditMode(true);
  };

  const saveEditedBooking = async () => {
    if (!selectedBooking || !editedBooking) return;
    
    if (!editedBooking.date || !editedBooking.timeFrom) {
      alert("Wypełnij datę i godzinę");
      return;
    }

    const timeDisplay = editedBooking.timeFrom;

    const updatedBooking = {
      ...selectedBooking,
      date: editedBooking.date,
      time: timeDisplay,
      name: editedBooking.name,
      phone: editedBooking.phone,
      description: editedBooking.description,
    };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? updatedBooking : b
      )
    );
    
    setSelectedBooking(updatedBooking);
    
    // Zapisz zmiany do Supabase
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.chiropractor && selectedBooking.id) {
        // Próbuj zaktualizować w Supabase dla wszystkich bookingów z ID
        const API_URL = import.meta.env.VITE_API_URL || 
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                          ? 'https://ihc-app.vercel.app'
                          : window.location.origin);
        
        const response = await fetch(`${API_URL}/api/bookings?id=${selectedBooking.id}&chiropractor=${encodeURIComponent(user.chiropractor)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updatedBooking,
            chiropractor: user.chiropractor,
            timeFrom: timeDisplay,
            // Kontekst użytkownika dla audit log
            user_id: user.id,
            user_login: user.login,
            user_email: user.email,
            source: 'ui'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Rezerwacja zaktualizowana w Supabase:', data.booking?.id);
          // Zaktualizuj ID jeśli zostało zmienione
          if (data.booking?.id && data.booking.id !== selectedBooking.id) {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === selectedBooking.id ? { ...b, id: data.booking.id } : b
              )
            );
            setSelectedBooking({ ...updatedBooking, id: data.booking.id });
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Błąd aktualizacji rezerwacji w Supabase:', response.statusText, errorData);
        }
      }
    } catch (error) {
      console.error('❌ Błąd aktualizacji rezerwacji w Supabase:', error.message);
    }
    
    setEditMode(false);
    setEditedBooking(null);
    setShowDatePickerInEdit(false);
    setShowTimeFromPickerInEdit(false);
    setShowTimeToPickerInEdit(false);
    setShowMonthPickerInEdit(false);
    setShowYearPickerInEdit(false);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedBooking(null);
    setShowDatePickerInEdit(false);
    setShowTimeFromPickerInEdit(false);
    setShowMonthPickerInEdit(false);
    setShowYearPickerInEdit(false);
  };

  const addNewEventAtSameTime = () => {
    if (!selectedBooking) return;
    
    // Parsuj czas wydarzenia (może być "10:00" lub "10:00 - 11:30")
    const timeParts = selectedBooking.time.split(" - ");
    const timeFrom = timeParts[0];
    
    // Ustaw dane dla nowego wydarzenia na tę samą datę i godzinę
    setNewEventData({
      date: selectedBooking.date,
      timeFrom: timeFrom,
      description: "",
    });
    setDatePickerViewDateForModal(selectedBooking.date);
    
    // Zamknij modal szczegółów i otwórz modal dodawania
    setSelectedBooking(null);
    setShowAddEventModal(true);
  };

  const changeWeek = (direction) => {
    const date = new Date(selectedDate + "T00:00:00");
    date.setDate(date.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  // Funkcja do generowania dni miesiąca dla mini-kalendarza
  const getMonthDays = (dateString) => {
    const date = new Date(dateString + "T00:00:00");
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Pierwszy dzień miesiąca
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Poniedziałek = 0
    
    // Ostatni dzień miesiąca
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Dni z poprzedniego miesiąca
    const prevMonth = new Date(year, month, 0);
    const daysPrevMonth = prevMonth.getDate();
    const prevDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysPrevMonth - i;
      const prevMonthNum = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      prevDays.push({
        date: `${prevYear}-${String(prevMonthNum + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        isCurrentMonth: false,
        day
      });
    }
    
    // Dni bieżącego miesiąca
    const currentDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentDays.push({
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        isCurrentMonth: true,
        day: i
      });
    }
    
    // Dni z następnego miesiąca (do wypełnienia siatki)
    const totalCells = prevDays.length + currentDays.length;
    const nextDays = [];
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthNum = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      nextDays.push({
        date: `${nextYear}-${String(nextMonthNum + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        isCurrentMonth: false,
        day: i
      });
    }
    
    return [...prevDays, ...currentDays, ...nextDays];
  };

  return (
    <>
      {/* Powiadomienie o zmianie daty/godziny rezerwacji */}
      {showChangeNotification && changeNotificationData && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            background: `linear-gradient(135deg, ${themeData.success} 0%, ${themeData.successDark} 100%)`,
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: `0 4px 20px ${themeData.successGlow}`,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "14px",
            fontWeight: 600,
            animation: "slideDown 0.3s ease-out",
            maxWidth: "90vw",
          }}
        >
          <span style={{ fontSize: "20px" }}>✅</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>
              <strong>{changeNotificationData.name}</strong> - Rezerwacja przeniesiona
            </div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              {changeNotificationData.oldDate} {changeNotificationData.oldTime} → {changeNotificationData.newDate} {changeNotificationData.newTime}
            </div>
          </div>
        </div>
      )}
      {/* Ghost element podczas przeciągania */}
      {isDragging && draggedBooking && (
        <div
          style={{
            position: "fixed",
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            zIndex: 10000,
            pointerEvents: "none",
            background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "8px",
            boxShadow: `0 4px 20px ${themeData.glow}`,
            border: `2px solid ${themeData.accent}`,
            fontSize: "14px",
            fontWeight: 600,
            maxWidth: "250px",
            transform: "translate(-50%, -50%)",
            transition: "none",
          }}
        >
          <div style={{ fontSize: "16px", marginBottom: "4px", fontWeight: 700 }}>
            {draggedBooking.name || draggedBooking.description || "Wydarzenie"}
          </div>
          <div style={{ fontSize: "12px", opacity: 0.9 }}>
            {draggedBooking.date} {draggedBooking.time}
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        height: "auto",
        overflow: "auto",
        overflowY: "auto",
        background: themeData.background,
        width: "100%",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Górny pasek z kontrolkami */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `2px solid ${themeData.border}`,
          background: themeData.gradient,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          boxShadow: `0 2px 8px ${themeData.shadow}`,
          marginTop: 0,
          minHeight: "56px",
          height: "56px",
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        {/* Przycisk Wróć po lewej */}
      <button
        onClick={() => navigate("/")}
        style={{
            padding: "6px 12px",
            borderRadius: 6,
            height: "32px",
            borderTop: `1px solid ${themeData.border}`,
            borderBottom: `1px solid ${themeData.border}`,
            borderLeft: `1px solid ${themeData.border}`,
            borderRight: `1px solid ${themeData.border}`,
          background: themeData.surfaceElevated,
          color: themeData.text,
          cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
            transition: "all 0.3s ease",
            boxShadow: `0 2px 8px ${themeData.shadow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
          e.currentTarget.style.borderColor = themeData.accent;
          e.currentTarget.style.color = "white";
          e.currentTarget.style.transform = "translateX(-2px)";
          e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = themeData.surfaceElevated;
          e.currentTarget.style.borderColor = themeData.border;
          e.currentTarget.style.color = themeData.text;
          e.currentTarget.style.transform = "translateX(0)";
          e.currentTarget.style.boxShadow = `0 2px 8px ${themeData.shadow}`;
        }}
      >
          ← Wróć
      </button>

        {/* Centrum z datą i strzałkami */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <button
            onClick={() => changeWeek("prev")}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              height: "32px",
              width: "32px",
              borderTop: `1px solid ${themeData.border}`,
              borderBottom: `1px solid ${themeData.border}`,
              borderLeft: `1px solid ${themeData.border}`,
              borderRight: `1px solid ${themeData.border}`,
          background: themeData.surfaceElevated,
          color: themeData.text,
          cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: `0 2px 8px ${themeData.shadow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
          e.currentTarget.style.borderColor = themeData.accent;
          e.currentTarget.style.color = "white";
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = themeData.surfaceElevated;
          e.currentTarget.style.borderColor = themeData.border;
          e.currentTarget.style.color = themeData.text;
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = `0 2px 8px ${themeData.shadow}`;
        }}
      >
            ←
      </button>

          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowMonthPicker(!showMonthPicker)}
            style={{
                padding: "6px 14px",
                borderRadius: 6,
                height: "32px",
                border: `2px solid ${themeData.border}`,
              background: themeData.surfaceElevated,
              color: themeData.text,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                minWidth: "130px",
                textAlign: "center",
                transition: "all 0.3s ease",
                boxShadow: `0 4px 12px ${themeData.shadow}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
                e.currentTarget.style.borderColor = themeData.accent;
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = themeData.surfaceElevated;
                e.currentTarget.style.borderColor = themeData.border;
                e.currentTarget.style.color = themeData.text;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.shadow}`;
              }}
            >
              {formatMonthName(selectedDate)} {currentYear}
      </div>

            {showMonthPicker && (
              <div
            style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginTop: "8px",
                  background: themeData.surface,
              border: `1px solid ${themeData.border}`,
                  borderRadius: 8,
                  padding: "8px",
                  zIndex: 1000,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "4px",
                  minWidth: "clamp(250px, 30vw, 300px)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                {months.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => selectMonth(index)}
                    style={{
                      padding: "10px 16px",
          borderRadius: 8,
          borderTop: `1px solid ${themeData.border}`,
          borderBottom: `1px solid ${themeData.border}`,
          borderLeft: `1px solid ${themeData.border}`,
          borderRight: `1px solid ${themeData.border}`,
                      background: index === currentMonth 
                        ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                        : themeData.surfaceElevated,
          color: index === currentMonth ? "white" : themeData.text,
          cursor: "pointer",
                      fontSize: "1.2rem",
                      fontWeight: index === currentMonth ? 600 : 400,
                      textAlign: "center",
                      transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          if (index !== currentMonth) {
            e.currentTarget.style.background = themeData.surface;
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (index !== currentMonth) {
            e.currentTarget.style.background = themeData.surfaceElevated;
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
                    {month}
      </button>
                ))}
              </div>
            )}
      </div>

          <button
            onClick={() => changeWeek("next")}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              height: "32px",
              width: "32px",
              borderTop: `1px solid ${themeData.border}`,
              borderBottom: `1px solid ${themeData.border}`,
              borderLeft: `1px solid ${themeData.border}`,
              borderRight: `1px solid ${themeData.border}`,
              background: themeData.surfaceElevated,
              color: themeData.text,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: `0 2px 8px ${themeData.shadow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
              e.currentTarget.style.borderColor = themeData.accent;
              e.currentTarget.style.color = "white";
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = themeData.surfaceElevated;
              e.currentTarget.style.borderColor = themeData.border;
              e.currentTarget.style.color = themeData.text;
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 2px 8px ${themeData.shadow}`;
            }}
          >
            →
          </button>

          <button
            onClick={() => setSelectedDate(todayISO())}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              height: "32px",
              border: `2px solid ${themeData.accent}`,
              background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
              color: themeData.text,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              marginLeft: 4,
              transition: "all 0.3s ease",
              boxShadow: `0 4px 12px ${themeData.glow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accentHover} 0%, ${themeData.accent} 100%)`;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
            }}
          >
            Dzisiaj
          </button>
      </div>

        {/* Informacja o rezerwacji po prawej */}
      {leadFromState && (
        <div
          style={{
              padding: "6px 12px",
              height: "32px",
              border: `2px solid ${themeData.accent}`,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
              fontSize: "12px",
              fontWeight: 600,
              color: themeData.text,
              boxShadow: `0 4px 12px ${themeData.glow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            Rezerwujesz: <b>{leadFromState.name}</b>
        </div>
      )}
      </div>

      {/* Główny kontener z sidebarem i kalendarzem */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0, height: "calc(100vh - 112px)", maxHeight: "calc(100vh - 112px)" }}>
        {/* Sidebar z mini-kalendarzem */}
        <div
          className="hide-scrollbar desktop-only"
          style={{
            width: "clamp(280px, 22vw, 350px)",
            border: `2px solid ${themeData.border}`,
            borderRadius: "0",
            background: themeData.gradient,
            padding: "clamp(12px, 2vw, 16px)",
            overflowY: "auto",
            flexShrink: 0,
            boxShadow: `2px 0 12px ${themeData.shadow}`,
            height: "100%",
            maxHeight: "calc(100vh - 112px)",
            boxSizing: "border-box",
          }}
        >
          <h3 style={{ 
            marginTop: 0, 
          marginBottom: 16,
            fontSize: "1.3rem", 
            fontWeight: 700,
            color: themeData.text,
          }}>
            Wybierz datę
          </h3>
          
          {/* Mini-kalendarz */}
          <div style={{ marginBottom: 12 }}>
            {/* Nagłówek miesiąca i roku - tylko strzałki, bez możliwości kliknięcia */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <button
                onClick={() => {
                  const date = new Date(datePickerViewDate + "T00:00:00");
                  date.setMonth(date.getMonth() - 1);
                  setDatePickerViewDate(date.toISOString().slice(0, 10));
                }}
                style={{
                  padding: "4px 8px",
                  background: themeData.surfaceElevated,
            border: `1px solid ${themeData.border}`,
            borderRadius: 4,
                  color: themeData.text,
          cursor: "pointer",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
                  e.currentTarget.style.borderColor = themeData.accent;
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.borderColor = themeData.border;
                  e.currentTarget.style.color = themeData.text;
                }}
              >
                ←
      </button>

              <div style={{
                padding: "4px 10px",
            background: themeData.surfaceElevated,
                border: `1px solid ${themeData.border}`,
                borderRadius: 4,
                color: themeData.text,
                fontSize: "1rem",
                fontWeight: 600,
                minWidth: "90px",
                textAlign: "center",
              }}>
                {formatMonthName(datePickerViewDate)} {new Date(datePickerViewDate + "T00:00:00").getFullYear()}
        </div>
              
              <button
                onClick={() => {
                  const date = new Date(datePickerViewDate + "T00:00:00");
                  date.setMonth(date.getMonth() + 1);
                  setDatePickerViewDate(date.toISOString().slice(0, 10));
                }}
            style={{
                  padding: "4px 8px",
                  background: themeData.surfaceElevated,
                  border: `1px solid ${themeData.border}`,
              borderRadius: 4,
                  color: themeData.text,
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
                  e.currentTarget.style.borderColor = themeData.accent;
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.borderColor = themeData.border;
                  e.currentTarget.style.color = themeData.text;
                }}
              >
                →
              </button>
      </div>

            {/* Dni tygodnia */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: 6 }}>
              {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
        <div
                  key={day}
          style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: themeData.textSecondary,
                    fontWeight: 600,
                    padding: "4px 0",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dni miesiąca */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {getMonthDays(datePickerViewDate).map((dayObj, index) => {
                const isSelected = dayObj.date === selectedDate;
                const isToday = dayObj.date === todayISO();
                const dayBookings = bookings.filter(b => b.date === dayObj.date);
                const hasBookings = dayBookings.length > 0;
          return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(dayObj.date);
                          setDatePickerViewDate(dayObj.date);
                          setViewMode('single'); // Przełącz na widok jednodniowy
                        }}
                        style={{
                          padding: "8px 4px",
                      background: isSelected
                        ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                        : isToday
                        ? themeData.surfaceElevated
                        : dayObj.isCurrentMonth
                        ? hasBookings
                          ? themeData.cardBackground
                          : themeData.surfaceElevated
                        : themeData.surface,
                      border: isSelected 
                        ? `2px solid ${themeData.accent}` 
                        : isToday 
                        ? `2px solid ${themeData.accent}`
                        : hasBookings
                        ? `2px solid ${themeData.accent}40`
                        : `1px solid ${themeData.border}`,
                      borderRadius: "6px",
                      color: isSelected ? "white" : (dayObj.isCurrentMonth ? themeData.text : themeData.textSecondary),
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: isSelected || isToday ? 700 : hasBookings ? 600 : 400,
                      transition: "all 0.3s ease",
                      position: "relative",
                      boxShadow: isSelected 
                        ? `0 4px 12px ${themeData.glow}`
                        : isToday
                        ? `0 2px 8px ${themeData.glow}`
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = themeData.surface;
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.shadow}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isToday
                          ? themeData.surfaceElevated
                          : dayObj.isCurrentMonth
                          ? hasBookings
                            ? themeData.cardBackground
                            : themeData.surfaceElevated
                          : themeData.surface;
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = isToday
                          ? `0 2px 8px ${themeData.glow}`
                          : "none";
                      }
                    }}
                  >
                    {dayObj.day}
                    {hasBookings && !isSelected && (
                      <div style={{
                        position: "absolute",
                        bottom: "4px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: themeData.accent,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista wydarzeń */}
          <div style={{ marginTop: 16 }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: 12,
              fontSize: "1.1rem",
              fontWeight: 600,
              color: themeData.text,
            }}>
              Wydarzenia
            </h3>
            <div 
              className="hide-scrollbar"
              style={{
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {bookings.length === 0 ? (
                <div style={{ 
                  color: themeData.textSecondary, 
                  fontSize: "0.85rem",
                  textAlign: "center",
                  padding: "12px 0"
                }}>
                  Brak wydarzeń
                </div>
              ) : (
                bookings
                  .sort((a, b) => {
                    const dateA = new Date(a.date + "T" + (a.time.split(" - ")[0] || a.time) + ":00");
                    const dateB = new Date(b.date + "T" + (b.time.split(" - ")[0] || b.time) + ":00");
                    return dateA - dateB;
                  })
                  .map((booking) => {
                    const bookingDate = new Date(booking.date + "T00:00:00");
                    const day = bookingDate.getDate();
                    const month = bookingDate.getMonth() + 1;
                    return (
                      <div
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        style={{
                          padding: "6px 8px",
                          marginBottom: 6,
                          maxWidth: "280px",
                          background: themeData.cardBackground,
                          border: `2px solid ${themeData.accentBorder}`,
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: `0 2px 8px ${themeData.shadow}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = themeData.surfaceElevated;
                          e.currentTarget.style.borderColor = `${themeData.accent}80`;
                          e.currentTarget.style.transform = "translateX(4px)";
                          e.currentTarget.style.boxShadow = `0 4px 16px ${themeData.glow}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = themeData.cardBackground;
                          e.currentTarget.style.borderColor = `${themeData.accent}40`;
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow = `0 2px 8px ${themeData.shadow}`;
                        }}
                      >
                        <div style={{ 
                          fontSize: "0.65rem", 
                          color: themeData.accent,
                          marginBottom: 2,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          {day}.{String(month).padStart(2, "0")}
                        </div>
                        <div style={{ 
                          fontSize: "0.8rem", 
                          fontWeight: 700,
                          marginBottom: 2,
                          color: themeData.accent,
                        }}>
                          {booking.time}
                        </div>
                        <div style={{ 
                          fontSize: "0.75rem", 
                          color: themeData.textSecondary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}>
                          {booking.name || booking.description || "Wydarzenie"}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Tabela kalendarza */}
              <div
                className="hide-scrollbar"
                style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            alignItems: "center",
            height: "100%",
            maxHeight: "calc(100vh - 112px)",
            boxSizing: "border-box",
          }}
        >
        {/* Kontener kalendarza z ramką - główny kontener do scrollowania */}
        <div 
          ref={scrollContainerRef}
          className="hide-scrollbar"
          style={{
            width: "95%",
            maxWidth: "clamp(100%, 95vw, 1200px)",
            height: "100%",
            maxHeight: "100%",
            border: `2px solid ${themeData.border}`,
            borderRadius: "10px",
            overflow: "auto",
            overflowY: "auto",
            boxShadow: `0 4px 20px ${themeData.shadow}`,
            background: themeData.background,
            boxSizing: "border-box",
            position: "relative",
          }}>
        {/* Przycisk powrotu do widoku tygodniowego */}
        {viewMode === 'single' && (
          <div style={{
            padding: "12px 20px",
            borderBottom: `2px solid ${themeData.border}`,
            background: themeData.gradient,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: `0 4px 12px ${themeData.shadow}`,
          }}>
            <button
              onClick={() => {
                setViewMode('week');
                setSelectedDate(todayISO());
              }}
              style={{
                padding: "8px 16px",
                background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                border: `2px solid ${themeData.accent}`,
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 600,
                transition: "all 0.3s ease",
                boxShadow: `0 4px 12px ${themeData.glow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
              }}
            >
              ← Powrót do widoku tygodniowego
            </button>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: themeData.text,
            }}>
              {formatDayName(selectedDate).dayName}, {formatDayName(selectedDate).dayNum}.{formatDayName(selectedDate).month}
            </div>
          </div>
        )}

        {/* Nagłówek z dniami - tylko w widoku tygodniowym */}
        {viewMode === 'week' && (
          <div
            style={{
            display: "grid",
            gridTemplateColumns: "70px repeat(7, 1fr)",
            borderBottom: `2px solid ${themeData.border}`,
            background: themeData.gradient,
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: `0 4px 12px ${themeData.shadow}`,
          }}
        >
          <div style={{ 
            padding: "8px", 
            borderTop: "none",
            borderBottom: "none",
            borderLeft: "none",
            borderRight: `1px solid ${themeData.border}`,
            background: themeData.surface,
          }}></div>
          {weekDays.map((day) => {
            const { dayName, dayNum, month } = formatDayName(day);
            const isToday = day === todayISO();
            const dayBookings = bookings.filter(b => b.date === day);
            const hasBookings = dayBookings.length > 0;
            return (
              <div
                key={day}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode('single');
                }}
                style={{
                  padding: "10px 8px",
                  textAlign: "center",
                  borderRight: `1px solid ${themeData.border}`,
                  borderTop: isToday ? `2px solid ${themeData.accent}` : "none",
                  borderBottom: isToday ? `2px solid ${themeData.accent}` : "none",
                  borderLeft: isToday ? `2px solid ${themeData.accent}` : "none",
                  background: isToday
                    ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                    : hasBookings
                    ? themeData.cardBackground
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: isToday 
                    ? "0 4px 12px rgba(37, 99, 235, 0.4)"
                    : "none",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.background = themeData.surfaceElevated;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.background = hasBookings
                      ? themeData.cardBackground
                      : "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <div style={{ 
                  fontSize: "0.85rem",
                  color: isToday ? "#fff" : themeData.textSecondary, 
                  marginBottom: "4px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  {dayName.slice(0, 3)}
                </div>
                <div style={{ 
                  fontSize: "1.3rem", 
                  fontWeight: 700,
                  color: isToday ? "#fff" : themeData.text,
                  marginBottom: hasBookings ? "2px" : "0",
                }}>
                  {dayNum}.{month}
                </div>
                {hasBookings && (
                  <div style={{
                    fontSize: "0.65rem",
                    color: themeData.accent,
                    fontWeight: 600,
                    marginTop: "2px",
                  }}>
                    {dayBookings.length} {dayBookings.length === 1 ? "wizyta" : "wizyt"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {/* Siatka godzin */}
        {viewMode === 'single' ? (
          /* Widok jednodniowy - lista godzin */
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "20px",
          }}>
            {HOURS_DISPLAYED.map((time, hourIndex) => {
              const isToday = selectedDate === todayISO();
              const cellBookings = getBookingsForCell(selectedDate, time);
              const hasBooking = cellBookings.length > 0;
              const currentHour = new Date().getHours();
              const timeHour = parseInt(time.split(":")[0]);
              const isCurrentHour = currentHour === timeHour && isToday;
              const isEvenHour = hourIndex % 2 === 0;

          const isDragOver = dragOverCell?.date === selectedDate && dragOverCell?.time === time;
          return (
            <div
              key={time}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(selectedDate, time);
                  }}
                  onDragOver={(e) => handleCellDragOver(e, selectedDate, time)}
                  onDragLeave={handleCellDragLeave}
                  onDrop={(e) => handleCellDrop(e, selectedDate, time)}
              style={{
                display: "flex",
                alignItems: "stretch",
                    gap: "20px",
                    padding: "16px 20px",
                    marginBottom: "12px",
                    border: `2px solid ${isDragOver ? themeData.success : (hasBooking ? themeData.accent : themeData.border)}`,
                    borderRadius: "12px",
                    background: isDragOver
                      ? `${themeData.success}30`
                      : (hasBooking
                      ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                      : isCurrentHour
                      ? `${themeData.accent}20`
                      : isEvenHour ? themeData.surfaceElevated : themeData.surface),
                cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: isDragOver ? `0 0 20px ${themeData.successGlow}` : (hasBooking ? `0 4px 12px ${themeData.shadow}` : "none"),
                  }}
                  onMouseEnter={(e) => {
                    if (!hasBooking && !isDragOver) {
                      e.currentTarget.style.background = themeData.surfaceElevated;
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasBooking && !isDragOver) {
                      e.currentTarget.style.background = isEvenHour ? themeData.surfaceElevated : themeData.surface;
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <div style={{
                    minWidth: "80px",
                    fontSize: "1.3rem",
                    fontWeight: isCurrentHour ? 700 : 600,
                    color: hasBooking ? "white" : (isCurrentHour ? themeData.accent : themeData.text),
                  }}>
                    {time}
                  </div>
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    alignSelf: "stretch",
                    minHeight: "100%",
                  }}>
                    {hasBooking ? (
                      cellBookings.map((booking, idx) => {
                        const lead = booking.leadId ? leads?.find(l => l.id === booking.leadId) : null;
                        const displayName = lead?.name || booking.name || booking.description || "Wydarzenie";
                        const isDragging = draggedBooking?.id === booking.id;
                        return (
                          <div
                            key={booking.id || `booking-${idx}`}
                            draggable="true"
                            onDragStart={(e) => handleBookingDragStart(e, booking)}
                            onDragEnd={handleBookingDragEnd}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "flex-start",
                              color: "white",
                              width: "100%",
                              cursor: "grab",
                              opacity: isDragging ? 0.5 : 1,
                              transition: "opacity 0.2s ease",
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div style={{ fontSize: "1rem", marginBottom: "4px", fontWeight: 700 }}>
                              {displayName}
                            </div>
                            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                              {booking.time}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        color: themeData.textSecondary,
                        fontSize: "1rem",
                        fontStyle: "italic",
                      }}>
                        Wolne
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Widok tygodniowy - standardowy kalendarz */
          <div style={{ 
            display: "flex", 
            flex: 1, 
            position: "relative",
            height: "100%",
            maxHeight: "100%",
          }}>
          {/* Kolumna z godzinami */}
          <div
            style={{
              width: "70px",
              borderTop: "none",
              borderBottom: "none",
              borderLeft: "none",
              borderRight: `2px solid ${themeData.border}`,
              background: themeData.gradient,
              flexShrink: 0,
              boxShadow: `2px 0 8px ${themeData.shadow}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {HOURS_DISPLAYED.map((time) => {
              const currentHour = new Date().getHours();
              const timeHour = parseInt(time.split(":")[0]);
              const isCurrentHour = currentHour === timeHour && selectedDate === todayISO();
          return (
            <div
              key={time}
              style={{
                    height: "60px",
                    minHeight: "60px",
                    maxHeight: "60px",
                    padding: "6px 8px",
                    fontSize: "0.85rem",
                    color: isCurrentHour ? themeData.accent : themeData.textSecondary,
                    borderBottom: `1px solid ${themeData.border}`,
                display: "flex",
                    alignItems: "flex-start",
                    fontWeight: isCurrentHour ? 700 : 500,
                    background: isCurrentHour ? `${themeData.accent}20` : "transparent",
                    position: "relative",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  {isCurrentHour && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      background: `linear-gradient(180deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                      borderRadius: "0 4px 4px 0",
                    }} />
                  )}
                {time}
            </div>
          );
        })}
      </div>

          {/* Kolumny z dniami */}
          <div 
            style={{ 
              display: "flex", 
              flex: 1, 
              position: "relative",
            }}>
            {/* Pasek aktualnej godziny - tylko dla dzisiejszego dnia */}
            {weekDays.map((day) => (
              <div
                key={day}
                style={{
                  flex: 1,
                  borderTop: "none",
                  borderBottom: "none",
                  borderLeft: "none",
                  borderRight: `1px solid ${themeData.border}`,
                  background: themeData.background,
                  display: "flex",
                  flexDirection: "column",
                  boxSizing: "border-box",
                }}
              >
        {HOURS_DISPLAYED.map((time, hourIndex) => {
                  const isToday = day === todayISO();
                  const cellBookings = getBookingsForCell(day, time);
                  const hasBooking = cellBookings.length > 0;
                  const currentHour = new Date().getHours();
                  const timeHour = parseInt(time.split(":")[0]);
                  const isCurrentHour = currentHour === timeHour && isToday;
                  const isEvenHour = hourIndex % 2 === 0;
                  const isDragOver = dragOverCell?.date === day && dragOverCell?.time === time;
          return (
            <div
              key={time}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(day, time);
                      }}
                      onDragOver={(e) => handleCellDragOver(e, day, time)}
                      onDragLeave={handleCellDragLeave}
                      onDrop={(e) => handleCellDrop(e, day, time)}
              style={{
                        height: "60px",
                        minHeight: "60px",
                        maxHeight: "60px",
                        borderBottom: `1px solid ${themeData.border}`,
                        borderTop: `1px solid transparent`,
                        borderLeft: "none",
                        borderRight: `1px solid ${themeData.border}`,
                        background: isDragOver
                          ? `${themeData.success}30`
                          : (hasBooking 
                          ? `linear-gradient(135deg, ${themeData.accent}15 0%, ${themeData.accentHover}10 100%)`
                          : isCurrentHour
                          ? `${themeData.accent}20`
                          : isToday 
                          ? isEvenHour ? themeData.surfaceElevated : themeData.surface
                          : isEvenHour ? themeData.background : themeData.surface),
                        padding: "6px",
                cursor: "pointer",
                        position: "relative",
                        transition: "all 0.3s ease",
                        zIndex: isDragOver ? 10 : 1,
                        pointerEvents: "auto",
                        flexShrink: 0,
                        boxSizing: "border-box",
                        boxShadow: isDragOver ? `0 0 15px ${themeData.successGlow} inset` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isToday && !hasBooking && !isCurrentHour) {
                          e.currentTarget.style.background = themeData.surfaceElevated;
                          e.currentTarget.style.transform = "scale(1.02)";
                        } else if (hasBooking) {
                          e.currentTarget.style.background = themeData.surfaceElevated;
                        } else if (isCurrentHour) {
                          e.currentTarget.style.background = `${themeData.accent}30`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isToday && !hasBooking && !isCurrentHour) {
                          e.currentTarget.style.background = isEvenHour ? themeData.background : themeData.surface;
                          e.currentTarget.style.transform = "scale(1)";
                        } else if (hasBooking) {
                          e.currentTarget.style.background = themeData.cardBackground;
                        } else if (isCurrentHour) {
                          e.currentTarget.style.background = `${themeData.accent}20`;
                        }
                      }}
                    >
                      {isCurrentHour && !hasBooking && (
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "3px",
                          background: `linear-gradient(180deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                          borderRadius: "0 4px 4px 0",
                        }} />
                      )}
                      {hasBooking && (
                        <div
                          draggable="true"
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleBookingDragStart(e, cellBookings[0]);
                          }}
                          onDragEnd={(e) => {
                            e.stopPropagation();
                            handleBookingDragEnd(e);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(cellBookings[0]);
                          }}
                style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "calc(100% - 16px)",
                            background: highlightedBookingId === cellBookings[0].id 
                              ? (theme === 'night' 
                                ? "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)"
                                : `linear-gradient(135deg, ${themeData.success} 0%, ${themeData.successDark} 100%)`)
                              : `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                            border: highlightedBookingId === cellBookings[0].id
                              ? (theme === 'night' ? "2px solid #eab308" : `2px solid ${themeData.success}`)
                              : `2px solid ${themeData.accent}`,
                            borderRadius: "4px",
                            padding: "3px 6px",
                  fontSize: "0.65rem",
                            color: "#fff",
                            fontWeight: 600,
                            cursor: draggedBooking?.id === cellBookings[0].id ? "grabbing" : "grab",
                            zIndex: draggedBooking?.id === cellBookings[0].id ? 100 : 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                            transition: "all 0.3s ease",
                            opacity: draggedBooking?.id === cellBookings[0].id ? 0.3 : 1,
                            boxShadow: highlightedBookingId === cellBookings[0].id
                              ? (theme === 'night'
                                ? "0 0 15px rgba(234, 179, 8, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4)"
                                : `0 0 15px ${themeData.successGlow}, 0 2px 8px ${themeData.shadow}`)
                              : `0 0 12px ${themeData.glow}, 0 2px 8px ${themeData.shadow}`,
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => {
                            if (draggedBooking?.id !== cellBookings[0].id) {
                              e.currentTarget.style.transform = "translate(-50%, -50%) translateY(-1px) scale(1.01)";
                              e.currentTarget.style.boxShadow = highlightedBookingId === cellBookings[0].id
                                ? (theme === 'night'
                                  ? "0 0 20px rgba(234, 179, 8, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)"
                                  : `0 0 20px ${themeData.successGlow}, 0 4px 12px ${themeData.shadow}`)
                                : `0 0 15px ${themeData.glow}, 0 4px 12px ${themeData.shadow}`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (draggedBooking?.id !== cellBookings[0].id) {
                              e.currentTarget.style.transform = "translate(-50%, -50%)";
                              e.currentTarget.style.boxShadow = highlightedBookingId === cellBookings[0].id
                                ? (theme === 'night'
                                  ? "0 0 15px rgba(234, 179, 8, 0.4), 0 2px 8px rgba(0, 0, 0, 0.4)"
                                  : `0 0 15px ${themeData.successGlow}, 0 2px 8px ${themeData.shadow}`)
                                : `0 0 12px ${themeData.glow}, 0 2px 8px ${themeData.shadow}`;
                            }
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.7rem" }}>👤</span>
                            <span>{cellBookings[0].time} - {cellBookings[0].name || cellBookings[0].description || "Wydarzenie"}</span>
              </div>
              </div>
                      )}
            </div>
          );
        })}
              </div>
            ))}
          </div>
        </div>
        )}
        {/* Zamknięcie kontenera z ramką */}
        </div>
        </div>
      </div>

      {/* Overlay do zamknięcia month picker */}
      {showMonthPicker && (
        <div
          onClick={() => setShowMonthPicker(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
          }}
        />
      )}

      {/* Modal szczegółów wizyty */}
      {selectedBooking && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (!editMode) {
                setSelectedBooking(null);
              } else {
                setEditMode(false);
                setEditedBooking(null);
                setShowDatePickerInEdit(false);
                setShowTimeFromPickerInEdit(false);
                setShowTimeToPickerInEdit(false);
              }
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: editMode ? "20px" : "32px",
              background: themeData.surface,
              borderRadius: 16,
              width: editMode ? "90%" : "95%",
              maxWidth: editMode ? 600 : 800,
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              border: `2px solid ${themeData.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              height: "4px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "16px 16px 0 0",
            }} />
            
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: editMode ? 16 : 28, 
              fontSize: editMode ? "20px" : "28px", 
              fontWeight: 700,
              color: themeData.text,
            }}>
              Szczegóły wizyty
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: editMode ? 12 : 20 }}>
              {/* Data */}
              <div style={{ fontSize: editMode ? "13px" : "16px" }}>
                <strong style={{ color: themeData.textSecondary, display: "block", marginBottom: editMode ? 6 : 8, fontSize: editMode ? "12px" : "15px", fontWeight: 600 }}>Data:</strong>
                {editMode && editedBooking ? (
                  <div style={{ position: "relative" }}>
                    <div
                      onClick={() => {
                        setShowDatePickerInEdit(!showDatePickerInEdit);
                        setShowTimeFromPickerInEdit(false);
                        setShowTimeToPickerInEdit(false);
                      }}
                      style={{
                        width: "100%",
                        padding: editMode ? "8px 12px" : "12px 16px",
                        background: themeData.surfaceElevated,
                        color: themeData.text,
                        border: `2px solid ${themeData.border}`,
              borderRadius: 8,
                        fontSize: editMode ? "13px" : "16px",
                        cursor: "pointer",
                        minHeight: editMode ? "36px" : "48px",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeData.accent;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                      }}
                    >
                      {editedBooking.date || "Wybierz datę"}
                    </div>
                    {showDatePickerInEdit && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          marginTop: 8,
                          background: themeData.surface,
                          border: `2px solid ${themeData.border}`,
                          borderRadius: 12,
                          padding: editMode ? "12px" : "24px",
                          zIndex: 1002,
                          minWidth: editMode ? "clamp(250px, 30vw, 280px)" : "clamp(300px, 40vw, 400px)",
                          maxWidth: editMode ? "clamp(280px, 35vw, 320px)" : "clamp(350px, 45vw, 400px)",
                          boxShadow: `0 4px 16px ${themeData.shadow}`,
                        }}
                      >
                        {/* Header kalendarza */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editMode ? 10 : 16 }}>
                          <button
                            onClick={() => {
                              const date = new Date(datePickerViewDateForEdit + "T12:00:00");
                              const year = date.getFullYear();
                              const month = date.getMonth();
                              const newMonth = month === 0 ? 11 : month - 1;
                              const newYear = month === 0 ? year - 1 : year;
                              const dateString = `${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`;
                              setDatePickerViewDateForEdit(dateString);
                            }}
                            style={{
                              padding: editMode ? "6px 10px" : "12px 16px",
                              background: themeData.surfaceElevated,
                              border: `1px solid ${themeData.border}`,
                              borderRadius: 6,
                              color: themeData.text,
                              cursor: "pointer",
                              fontSize: editMode ? "14px" : "1.7rem",
                              flexShrink: 0,
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
                              e.currentTarget.style.borderColor = themeData.accent;
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = themeData.surfaceElevated;
                              e.currentTarget.style.borderColor = themeData.border;
                              e.currentTarget.style.color = themeData.text;
                            }}
                          >
                            ←
                          </button>
                          
                          <div style={{ display: "flex", gap: editMode ? 8 : 12, alignItems: "center" }}>
                            <div
                              onClick={() => {
                                setShowMonthPickerInEdit(!showMonthPickerInEdit);
                                setShowYearPickerInEdit(false);
                              }}
                              style={{
                                padding: editMode ? "6px 10px" : "12px 16px",
                                background: themeData.surfaceElevated,
                                border: `1px solid ${themeData.border}`,
                                borderRadius: 6,
                                color: themeData.text,
                                cursor: "pointer",
                                fontSize: editMode ? "13px" : "1.8rem",
                                fontWeight: 600,
                                minWidth: editMode ? "90px" : "130px",
                                maxWidth: editMode ? "110px" : "160px",
                                textAlign: "center",
                                flexShrink: 1,
                                boxSizing: "border-box",
                                transition: "all 0.3s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
                                e.currentTarget.style.borderColor = themeData.accent;
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = themeData.surfaceElevated;
                                e.currentTarget.style.borderColor = themeData.border;
                                e.currentTarget.style.color = themeData.text;
                              }}
                            >
                              {formatMonthName(datePickerViewDateForEdit)}
                            </div>
                            
                            <div
                              onClick={() => {
                                setShowYearPickerInEdit(!showYearPickerInEdit);
                                setShowMonthPickerInEdit(false);
                              }}
                              style={{
                                padding: editMode ? "6px 10px" : "12px 16px",
                                background: themeData.surfaceElevated,
                                border: `1px solid ${themeData.border}`,
                                borderRadius: 6,
                                color: themeData.text,
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                fontSize: editMode ? "13px" : "1.8rem",
                                fontWeight: 600,
                                minWidth: editMode ? "60px" : "90px",
                                maxWidth: editMode ? "75px" : "110px",
                                textAlign: "center",
                                flexShrink: 1,
                                boxSizing: "border-box",
                              }}
                            >
                              {new Date(datePickerViewDateForEdit + "T12:00:00").getFullYear()}
                            </div>
                          </div>
                          
              <button
                            onClick={() => {
                              const date = new Date(datePickerViewDateForEdit + "T12:00:00");
                              const year = date.getFullYear();
                              const month = date.getMonth();
                              const newMonth = month === 11 ? 0 : month + 1;
                              const newYear = month === 11 ? year + 1 : year;
                              const dateString = `${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`;
                              setDatePickerViewDateForEdit(dateString);
                            }}
                            style={{
                              padding: editMode ? "6px 10px" : "12px 16px",
                              background: themeData.surfaceElevated,
                              border: `1px solid ${themeData.border}`,
                              borderRadius: 6,
                              color: themeData.text,
                              cursor: "pointer",
                              fontSize: editMode ? "14px" : "1.7rem",
                              flexShrink: 0,
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`;
                              e.currentTarget.style.borderColor = themeData.accent;
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = themeData.surfaceElevated;
                              e.currentTarget.style.borderColor = themeData.border;
                              e.currentTarget.style.color = themeData.text;
                            }}
                          >
                            →
                          </button>
                        </div>
                        
                        {/* Wybór miesiąca */}
                        {showMonthPickerInEdit && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              top: editMode ? "50px" : "80px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: themeData.surface,
                              border: `2px solid ${themeData.border}`,
                              borderRadius: 12,
                              padding: editMode ? "8px" : "12px",
                              zIndex: 1003,
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: editMode ? "4px" : "6px",
                              minWidth: editMode ? "240px" : "300px",
                              boxShadow: `0 4px 16px ${themeData.shadow}`,
                            }}
                          >
                            {months.map((month, index) => {
                              const viewDate = new Date(datePickerViewDateForEdit + "T12:00:00");
                              const isSelected = index === viewDate.getMonth();
                              return (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const year = viewDate.getFullYear();
                                    const monthNum = index + 1;
                                    const dateString = `${year}-${String(monthNum).padStart(2, "0")}-01`;
                                    setDatePickerViewDateForEdit(dateString);
                                    setShowMonthPickerInEdit(false);
                                  }}
                                  style={{
                                    padding: editMode ? "6px 10px" : "12px 16px",
              borderRadius: 8,
                                    border: `1px solid ${themeData.border}`,
                                    background: isSelected 
                                      ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                                      : themeData.surfaceElevated,
                                    color: isSelected ? "white" : themeData.text,
                                    cursor: "pointer",
                                    fontSize: editMode ? "11px" : "1.3rem",
                                    fontWeight: isSelected ? 600 : 400,
                                    textAlign: "center",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = themeData.surface;
                                      e.currentTarget.style.transform = "scale(1.05)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = themeData.surfaceElevated;
                                      e.currentTarget.style.transform = "scale(1)";
                                    }
                                  }}
                                >
                                  {month}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Wybór roku */}
                        {showYearPickerInEdit && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="hide-scrollbar"
                            style={{
                              position: "absolute",
                              top: editMode ? "50px" : "80px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: themeData.surface,
                              border: `2px solid ${themeData.border}`,
                              borderRadius: 12,
                              padding: editMode ? "8px" : "12px",
                              zIndex: 1003,
                              maxHeight: editMode ? "200px" : "300px",
                              overflowY: "auto",
                              minWidth: editMode ? "120px" : "150px",
                              boxShadow: `0 4px 16px ${themeData.shadow}`,
                            }}
                          >
                            {Array.from({ length: 20 }, (_, i) => {
                              const year = new Date().getFullYear() - 10 + i;
                              const viewDate = new Date(datePickerViewDateForEdit + "T12:00:00");
                              const isSelected = year === viewDate.getFullYear();
                              const month = viewDate.getMonth() + 1;
                              return (
              <button
                                  key={year}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const dateString = `${year}-${String(month).padStart(2, "0")}-01`;
                                    setDatePickerViewDateForEdit(dateString);
                                    setShowYearPickerInEdit(false);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: editMode ? "6px 10px" : "12px 16px",
                                    borderRadius: 8,
                                    border: `1px solid ${themeData.border}`,
                                    background: isSelected 
                                      ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                                      : themeData.surfaceElevated,
                                    color: isSelected ? "white" : themeData.text,
                                    cursor: "pointer",
                                    fontSize: editMode ? "11px" : "1.3rem",
                                    fontWeight: isSelected ? 600 : 400,
                                    textAlign: "center",
                                    marginBottom: "4px",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = themeData.surface;
                                      e.currentTarget.style.transform = "scale(1.05)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = themeData.surfaceElevated;
                                      e.currentTarget.style.transform = "scale(1)";
                                    }
                                  }}
                                >
                                  {year}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Dni tygodnia */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: editMode ? "4px" : "6px", marginBottom: editMode ? 8 : 12 }}>
                          {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
                            <div
                              key={day}
                              style={{
                                textAlign: "center",
                                fontSize: editMode ? "11px" : "1.3rem",
                                color: themeData.textSecondary,
                                fontWeight: 600,
                                padding: editMode ? "6px 0" : "10px 0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Dni miesiąca */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: editMode ? "4px" : "6px" }}>
                          {getMonthDays(datePickerViewDateForEdit).map((dayObj, index) => {
                            const isSelected = dayObj.date === editedBooking.date;
                            const isToday = dayObj.date === todayISO();
                            return (
              <button
                                key={index}
                                onClick={() => {
                                  setEditedBooking((prev) => ({ ...prev, date: dayObj.date }));
                                  setShowDatePickerInEdit(false);
                                }}
                                style={{
                                  padding: editMode ? "8px 4px" : "14px 0",
                                  background: isSelected
                                    ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                                    : isToday
                                    ? themeData.surfaceElevated
                                    : dayObj.isCurrentMonth
                                    ? themeData.surfaceElevated
                                    : themeData.surface,
                                  border: isSelected ? `2px solid ${themeData.accent}` : `1px solid ${themeData.border}`,
                                  borderRadius: 8,
                                  color: isSelected ? "white" : (dayObj.isCurrentMonth ? themeData.text : themeData.textSecondary),
                                  cursor: "pointer",
                                  fontSize: editMode ? "12px" : "1.4rem",
                                  fontWeight: isSelected || isToday ? 700 : 400,
                                  transition: "all 0.3s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  aspectRatio: "1",
                                  minHeight: editMode ? "32px" : "48px",
                                  boxSizing: "border-box",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = themeData.surface;
                                    e.currentTarget.style.transform = "scale(1.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = isToday
                                      ? themeData.surfaceElevated
                                      : dayObj.isCurrentMonth
                                      ? themeData.surfaceElevated
                                      : themeData.surface;
                                    e.currentTarget.style.transform = "scale(1)";
                                  }
                                }}
                              >
                                {dayObj.day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: "18px", color: themeData.text, fontWeight: 500 }}>{selectedBooking.date}</span>
                )}
              </div>
              
              {/* Godzina */}
              <div style={{ fontSize: editMode ? "13px" : "16px" }}>
                <strong style={{ color: themeData.textSecondary, display: "block", marginBottom: editMode ? 6 : 8, fontSize: editMode ? "12px" : "15px", fontWeight: 600 }}>Godzina:</strong>
                {editMode && editedBooking ? (
                  <div style={{ position: "relative" }}>
                    <div
                      onClick={() => {
                        setShowTimeFromPickerInEdit(!showTimeFromPickerInEdit);
                        setShowTimeToPickerInEdit(false);
                        setShowDatePickerInEdit(false);
                      }}
                      style={{
                        width: "100%",
                        padding: editMode ? "8px 12px" : "12px 16px",
                        background: themeData.surfaceElevated,
                        color: themeData.text,
                        border: `2px solid ${themeData.border}`,
                        borderRadius: 8,
                        fontSize: editMode ? "13px" : "16px",
                        cursor: "pointer",
                        minHeight: editMode ? "36px" : "48px",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.3s ease",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = themeData.accent;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                      }}
                    >
                      {editedBooking.timeFrom || "Wybierz godzinę"}
                    </div>
                      
                      {showTimeFromPickerInEdit && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="hide-scrollbar"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            marginTop: 8,
                            background: themeData.surface,
                            border: `2px solid ${themeData.border}`,
                            borderRadius: 12,
                            padding: editMode ? "12px" : "20px",
                            zIndex: 1002,
                            minWidth: editMode ? "280px" : "400px",
                            maxWidth: editMode ? "320px" : "400px",
                            maxHeight: editMode ? "400px" : "700px",
                            overflowY: "auto",
                            boxShadow: `0 4px 16px ${themeData.shadow}`,
                          }}
                        >
                          <div style={{ display: "grid", gridTemplateColumns: editMode ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: editMode ? "6px" : "8px" }}>
                            {(() => {
                              const times = [];
                              for (let hour = 6; hour <= 23; hour++) {
                                for (const minute of [0, 30]) {
                                  const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                                  times.push(timeString);
                                }
                              }
                              return times.map((timeString) => {
                                const isSelected = editedBooking.timeFrom === timeString;
                                return (
                                  <button
                                    key={timeString}
                                    data-time={timeString}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditedBooking((prev) => ({ ...prev, timeFrom: timeString }));
                                      setShowTimeFromPickerInEdit(false);
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                    style={{
                                      padding: "8px 6px",
                                      background: isSelected 
                                        ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                                        : themeData.surfaceElevated,
                                      border: `1px solid ${themeData.border}`,
                                      borderRadius: 6,
                                      color: isSelected ? "white" : themeData.text,
                                      cursor: "pointer",
                                      fontSize: editMode ? "11px" : "12px",
                                      fontWeight: isSelected ? 600 : 400,
                                      transition: "all 0.3s ease",
                                      pointerEvents: "auto",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = themeData.surface;
                                        e.currentTarget.style.transform = "scale(1.05)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = themeData.surfaceElevated;
                                        e.currentTarget.style.transform = "scale(1)";
                                      }
                                    }}
                                  >
                                    {timeString}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                ) : (
                  <span style={{ fontSize: "18px", color: themeData.text, fontWeight: 500 }}>{selectedBooking.time}</span>
                )}
              </div>
              
              {/* Pacjent */}
              <div style={{ fontSize: editMode ? "13px" : "16px" }}>
                <strong style={{ color: themeData.textSecondary, display: "block", marginBottom: editMode ? 6 : 8, fontSize: editMode ? "12px" : "15px", fontWeight: 600 }}>Pacjent:</strong>
                {editMode && editedBooking ? (
                  <input
                    type="text"
                    value={editedBooking.name}
                    onChange={(e) => setEditedBooking((prev) => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: editMode ? "8px 12px" : "12px 16px",
                      background: themeData.surfaceElevated,
                      color: themeData.text,
                      border: `2px solid ${themeData.border}`,
                      borderRadius: 8,
                      fontSize: editMode ? "13px" : "16px",
                      transition: "all 0.3s ease",
                      minHeight: editMode ? "36px" : "48px",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "18px", fontWeight: 600 }}>{selectedBooking.name}</span>
                    {(() => {
                      const lead = selectedBooking.leadId ? leads?.find(l => l.id === selectedBooking.leadId) : null;
                      const hasDescription = lead?.description && lead.description.length > 0;
                      const hasNotes = lead?.notes && lead.notes.length > 0;
                      
                      if (lead && (hasDescription || hasNotes)) {
                        return (
                          <button
                            onClick={() => setShowFullPatientInfoModal(true)}
                            style={{
                              padding: "8px 14px",
                              background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                              color: "white",
                              border: `1px solid ${themeData.accent}`,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.3s ease",
                              boxShadow: `0 4px 12px ${themeData.glow}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                            }}
                          >
                            📋 Pokaż opis
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
              
              {/* Telefon */}
              <div style={{ fontSize: editMode ? "13px" : "16px" }}>
                <strong style={{ color: themeData.textSecondary, display: "block", marginBottom: editMode ? 6 : 8, fontSize: editMode ? "12px" : "15px", fontWeight: 600 }}>Telefon:</strong>
                {editMode && editedBooking ? (
                  <input
                    type="text"
                    value={editedBooking.phone}
                    onChange={(e) => setEditedBooking((prev) => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: editMode ? "8px 12px" : "12px 16px",
                      background: themeData.surfaceElevated,
                      color: themeData.text,
                      border: `2px solid ${themeData.border}`,
                      borderRadius: 8,
                      fontSize: editMode ? "13px" : "16px",
                      minHeight: editMode ? "36px" : "48px",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "18px", fontWeight: 500 }}>{selectedBooking.phone || "-"}</span>
                )}
              </div>
              
              {/* Opis pacjenta */}
              {!editMode && selectedBooking.description && selectedBooking.description.length > 0 && (
                <div style={{ fontSize: "16px" }}>
                  <strong style={{ color: themeData.textSecondary, display: "block", marginBottom: 8, fontSize: "15px", fontWeight: 600 }}>Opis pacjenta:</strong>
                  <div style={{ 
                    marginBottom: 12,
                    padding: "12px 16px",
                    background: themeData.surfaceElevated,
                    border: `1px solid ${themeData.border}`,
                    borderRadius: 8,
                    fontSize: "15px",
                    color: themeData.textSecondary,
                    lineHeight: "1.6",
                    maxHeight: "140px",
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    {selectedBooking.description.length > 200 
                      ? selectedBooking.description.substring(0, 200) + "..."
                      : selectedBooking.description
                    }
                    {selectedBooking.description.length > 200 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "50px",
                          background: `linear-gradient(to top, ${themeData.surfaceElevated}, transparent)`,
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              
              {/* Opis */}
              {editMode && editedBooking && (
                <div style={{ fontSize: editMode ? "13px" : "16px" }}>
                  <strong style={{ color: themeData.textSecondary, display: "block", marginBottom: editMode ? 6 : 8, fontSize: editMode ? "12px" : "15px", fontWeight: 600 }}>Opis:</strong>
                  <textarea
                    value={editedBooking.description || ""}
                    onChange={(e) => setEditedBooking((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Wprowadź opis wydarzenia (opcjonalnie)"
                    spellCheck="true"
                    lang="pl"
                    style={{
                      width: "100%",
                      minHeight: editMode ? 80 : 120,
                      padding: editMode ? "8px 12px" : "12px 16px",
                      background: themeData.surfaceElevated,
                      color: themeData.text,
                      border: `2px solid ${themeData.border}`,
                      borderRadius: 8,
                      fontSize: editMode ? "13px" : "15px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: editMode ? 20 : 32, display: "flex", gap: editMode ? 10 : 14, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {editMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: editMode ? "8px 16px" : "12px 24px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                      borderRadius: 8,
                  cursor: "pointer",
                      fontSize: editMode ? "13px" : "15px",
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = themeData.surface;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = themeData.surfaceElevated;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={saveEditedBooking}
                    style={{
                      padding: editMode ? "8px 16px" : "12px 24px",
                      background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                  color: "white",
                      border: `2px solid ${themeData.accent}`,
                      borderRadius: 8,
                  cursor: "pointer",
                      fontSize: editMode ? "13px" : "15px",
                      fontWeight: 700,
                      transition: "all 0.3s ease",
                      boxShadow: `0 4px 12px ${themeData.glow}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                      e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                    }}
                  >
                    💾 Zapisz zmiany
                  </button>
                </>
              ) : (
                <>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                      padding: "12px 24px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                      borderRadius: 10,
                  cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Zamknij
              </button>
                  <button
                    onClick={startEdit}
                    style={{
                      padding: "12px 24px",
                      background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                      color: "white",
                      border: `2px solid ${themeData.accent}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 700,
                      transition: "all 0.3s ease",
                      boxShadow: `0 4px 12px ${themeData.glow}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                      e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                    }}
                  >
                    ✏️ Edytuj
              </button>
              <button
                onClick={addNewEventAtSameTime}
                style={{
                      padding: "12px 24px",
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "white",
                  border: "2px solid #22c55e",
                      borderRadius: 10,
                  cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 700,
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(34, 197, 94, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.3)";
                }}
              >
                ➕ Dodaj nowe wydarzenie na tę godzinę
              </button>
              <button
                onClick={() => deleteBooking(selectedBooking.id)}
                style={{
                      padding: "12px 24px",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "white",
                  border: "2px solid #991b1b",
                      borderRadius: 10,
                  cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 700,
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(220, 38, 38, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.3)";
                }}
              >
                🗑️ Usuń wizytę
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal z pełnym opisem pacjenta */}
      {showFullDescriptionModal && selectedBooking && (
        <div
          onClick={() => setShowFullDescriptionModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "24px",
              background: themeData.surface,
              borderRadius: 16,
              width: "90%",
              maxWidth: 480,
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              border: `2px solid ${themeData.border}`,
              position: "relative",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "16px 16px 0 0",
            }} />
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{ 
                  margin: 0, 
                  fontSize: "20px", 
                  fontWeight: 700,
                  color: themeData.text,
                }}
              >
                Opis - {selectedBooking.name}
              </h2>
              <button
                onClick={() => setShowFullDescriptionModal(false)}
                style={{
                  background: themeData.surfaceElevated,
                  border: `1px solid ${themeData.border}`,
                  color: themeData.text,
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "rotate(0deg) scale(1)";
                }}
              >
                ×
              </button>
    </div>
            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
                background: themeData.surfaceElevated,
                borderRadius: 8,
                border: `1px solid ${themeData.border}`,
                fontSize: "14px",
                color: themeData.text,
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedBooking.description}
            </div>
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={() => setShowFullDescriptionModal(false)}
                style={{
                  padding: "8px 16px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal z pełnym opisem i notatkami pacjenta */}
      {showFullPatientInfoModal && selectedBooking && (
        <div
          onClick={() => setShowFullPatientInfoModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "24px",
              background: themeData.surface,
              borderRadius: 16,
              width: "90%",
              maxWidth: 480,
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              border: `2px solid ${themeData.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              height: "3px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "16px 16px 0 0",
            }} />
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{ 
                  margin: 0, 
                  fontSize: "20px",
                  fontWeight: 700,
                  color: themeData.text,
                }}
              >
                Opis - {selectedBooking.name}
              </h2>
              <button
                onClick={() => setShowFullPatientInfoModal(false)}
                style={{
                  background: themeData.surfaceElevated,
                  border: `1px solid ${themeData.border}`,
                  color: themeData.text,
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "all 0.3s ease",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "rotate(0deg) scale(1)";
                }}
              >
                ×
              </button>
            </div>
            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {(() => {
                const lead = selectedBooking.leadId ? leads?.find(l => l.id === selectedBooking.leadId) : null;
                const hasDescription = lead?.description && lead.description.length > 0;
                const hasNotes = lead?.notes && lead.notes.length > 0;
                const hasBookingDescription = selectedBooking.description && selectedBooking.description.length > 0;
                
                return (
                  <>
                    {hasDescription && (
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 6, color: themeData.textSecondary }}>
                          Opis pacjenta:
                        </h3>
                        <div
                          style={{
                            padding: "12px",
                            background: themeData.background,
                            borderRadius: 6,
                            border: `1px solid ${themeData.border}`,
                            fontSize: "14px",
                            color: themeData.text,
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {lead.description}
                        </div>
                      </div>
                    )}
                    {hasNotes && (
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 6, color: themeData.textSecondary }}>
                          Notatki:
                        </h3>
                        <div
                          style={{
                            padding: "12px",
                            background: themeData.background,
                            borderRadius: 6,
                            border: `1px solid ${themeData.border}`,
                            fontSize: "14px",
                            color: themeData.text,
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {lead.notes}
                        </div>
                      </div>
                    )}
                    {!hasDescription && !hasNotes && hasBookingDescription && (
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: 6, color: themeData.textSecondary }}>
                          Opis wydarzenia:
                        </h3>
                        <div
                          style={{
                            padding: "12px",
                            background: themeData.background,
                            borderRadius: 6,
                            border: `1px solid ${themeData.border}`,
                            fontSize: "14px",
                            color: themeData.text,
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {selectedBooking.description}
                        </div>
                      </div>
                    )}
                    {!hasDescription && !hasNotes && !hasBookingDescription && (
                      <div
                        style={{
                          padding: "12px",
                          background: themeData.background,
                          borderRadius: 6,
                          border: `1px solid ${themeData.border}`,
                          fontSize: "13px",
                          color: themeData.textSecondary,
                          textAlign: "center",
                        }}
                      >
                        Brak dostępnych informacji
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={() => setShowFullPatientInfoModal(false)}
                style={{
                  padding: "8px 16px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal dodawania wydarzenia */}
      {showAddEventModal && (
        <div
          onClick={(e) => {
            console.log("Modal backdrop clicked, showAddEventModal:", showAddEventModal);
            // Jeśli kliknięto w tło (nie w zawartość modalu), zamknij wszystko
            if (e.target === e.currentTarget) {
              setShowAddEventModal(false);
              setShowDatePicker(false);
              setShowMonthPickerInModal(false);
              setShowYearPickerInModal(false);
              setShowTimeFromPicker(false);
              setShowTimeToPicker(false);
              setNewEventData({ date: "", timeFrom: "", description: "" });
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0,0,0,${theme === 'night' ? '0.95' : '0.85'})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(4px)",
          }}
        >
          {console.log("Modal is rendering, showAddEventModal:", showAddEventModal)}
          <div
            onClick={(e) => {
              // Jeśli kliknięto w zawartość modalu, ale poza kalendarzem, zamknij tylko kalendarz
              if (showDatePicker && !e.target.closest('[data-date-picker]')) {
                setShowDatePicker(false);
                setShowMonthPickerInModal(false);
                setShowYearPickerInModal(false);
              }
              // Jeśli kliknięto w zawartość modalu, ale poza pickerem godzin, zamknij tylko pickery godzin
              if (showTimeFromPicker && !e.target.closest('[data-time-from-picker]')) {
                setShowTimeFromPicker(false);
              }
              if (showTimeToPicker && !e.target.closest('[data-time-to-picker]')) {
                setShowTimeToPicker(false);
              }
              // Zatrzymaj propagację, aby nie zamknąć całego modalu
              e.stopPropagation();
            }}
            style={{
              padding: "32px",
              background: themeData.surface,
              borderRadius: 16,
              width: "90%",
              maxWidth: 600,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 12px 48px ${themeData.shadow}`,
              border: `2px solid ${themeData.border}`,
              position: "relative",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Efekt świetlny na górze modala */}
            <div style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              right: "-2px",
              height: "3px",
              background: `linear-gradient(90deg, ${themeData.accent} 0%, transparent 100%)`,
              borderRadius: "16px 16px 0 0",
            }} />
            
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: 20, 
              fontSize: "20px", 
              fontWeight: 700,
              color: themeData.text,
            }}>
              Dodaj wydarzenie
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, overflowY: "auto", minHeight: 0, width: "100%", boxSizing: "border-box" }}>
              <div style={{ position: "relative", width: "100%", boxSizing: "border-box" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontSize: "14px", 
                  fontWeight: 600,
                  color: themeData.textSecondary
                }}>
                  Data *
                </label>
                <div
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: themeData.surfaceElevated,
                    color: themeData.text,
                    border: `2px solid ${themeData.border}`,
                    borderRadius: 8,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ flex: 1, textAlign: "left" }}>
                    {newEventData.date 
                      ? (() => {
                          const date = new Date(newEventData.date + "T00:00:00");
                          const day = String(date.getDate()).padStart(2, "0");
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const year = date.getFullYear();
                          return `${day}-${month}-${year}`;
                        })()
                      : "Brak daty"}
                  </span>
                  <span style={{ marginLeft: 8, flexShrink: 0 }}>📅</span>
                </div>
                
                {showDatePicker && (
                  <div
                    data-date-picker
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginTop: "8px",
                      background: themeData.surface,
                      border: `2px solid ${themeData.border}`,
                      borderRadius: 8,
                      padding: "12px",
                      zIndex: 1001,
                      width: "320px",
                      boxSizing: "border-box",
                      boxShadow: `0 8px 32px ${themeData.shadow}`,
                    }}
                  >
                    {/* Wybór roku */}
                    {showYearPickerInModal && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="hide-scrollbar"
                        style={{
                          position: "absolute",
                          top: "50px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: themeData.surface,
                          border: `2px solid ${themeData.border}`,
                          borderRadius: 8,
                          padding: "10px",
                          zIndex: 1002,
                          maxHeight: "200px",
                          overflowY: "auto",
                          width: "120px",
                          boxShadow: `0 4px 16px ${themeData.shadow}`,
                        }}
                      >
                        {Array.from({ length: 20 }, (_, i) => {
                          const year = new Date().getFullYear() - 10 + i;
                          const viewDate = new Date(datePickerViewDateForModal + "T12:00:00");
                          const isSelected = year === viewDate.getFullYear();
                          const month = viewDate.getMonth() + 1;
                          return (
                            <button
                              key={year}
                              onClick={(e) => {
                                e.stopPropagation();
                                const dateString = `${year}-${String(month).padStart(2, "0")}-01`;
                                setDatePickerViewDateForModal(dateString);
                                setShowYearPickerInModal(false);
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: `1px solid ${themeData.border}`,
                                background: isSelected 
                                  ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                                  : themeData.surfaceElevated,
                                color: isSelected ? "white" : themeData.text,
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: isSelected ? 600 : 400,
                                textAlign: "center",
                                marginBottom: "3px",
                              }}
                            >
                              {year}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Dni tygodnia */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: 8 }}>
                      {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
                        <div
                          key={day}
                          style={{
                            textAlign: "center",
                            fontSize: "11px",
                            color: themeData.textSecondary,
                            fontWeight: 600,
                            padding: "6px 0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Dni miesiąca */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                      {getMonthDays(datePickerViewDateForModal).map((dayObj, index) => {
                        const isSelected = dayObj.date === newEventData.date;
                        const isToday = dayObj.date === todayISO();
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setNewEventData((prev) => ({ ...prev, date: dayObj.date }));
                              setShowDatePicker(false);
                            }}
                            style={{
                              padding: "8px 4px",
                              background: isSelected
                                ? `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`
                                : isToday
                                ? themeData.surfaceElevated
                                : dayObj.isCurrentMonth
                                ? themeData.surfaceElevated
                                : themeData.surface,
                              border: isSelected ? `2px solid ${themeData.accent}` : `1px solid ${themeData.border}`,
                              borderRadius: 6,
                              color: isSelected ? "white" : (dayObj.isCurrentMonth ? themeData.text : themeData.textSecondary),
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: isSelected || isToday ? 700 : 400,
                              transition: "all 0.3s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              aspectRatio: "1",
                              minHeight: "32px",
                              boxSizing: "border-box",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = themeData.surface;
                                e.currentTarget.style.transform = "scale(1.05)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = isToday
                                  ? themeData.surfaceElevated
                                  : dayObj.isCurrentMonth
                                  ? themeData.surfaceElevated
                                  : themeData.surface;
                                e.currentTarget.style.transform = "scale(1)";
                              }
                            }}
                          >
                            {dayObj.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontSize: "14px", 
                  fontWeight: 600,
                  color: themeData.textSecondary
                }}>
                  Godzina *
                </label>
                <div style={{ width: "100%", boxSizing: "border-box", position: "relative" }}>
                    <div
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: themeData.surfaceElevated,
                        color: themeData.text,
                        border: `2px solid ${themeData.border}`,
                        borderRadius: 8,
                        fontSize: "14px",
                        minHeight: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxSizing: "border-box",
                      }}
                    >
                      <span style={{ flex: 1, textAlign: "left" }}>
                        {newEventData.timeFrom || "Brak godziny"}
                      </span>
                      <span style={{ marginLeft: 8, flexShrink: 0 }}>🕐</span>
                    </div>
                </div>
              </div>

              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontSize: "14px", 
                  fontWeight: 600,
                  color: themeData.textSecondary
                }}>
                  Opis
                </label>
                <textarea
                  value={newEventData.description}
                  onChange={(e) => setNewEventData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Wprowadź opis wydarzenia (opcjonalnie)"
                  style={{
                    width: "100%",
                    minHeight: 100,
                    maxHeight: 200,
                    padding: "12px 14px",
                    background: themeData.surfaceElevated,
                    color: themeData.text,
                    border: `2px solid ${themeData.border}`,
                    borderRadius: 8,
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: "1.5",
                    transition: "all 0.3s ease",
                    overflowY: "auto",
                    overflowX: "hidden",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeData.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeData.glow}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeData.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
              <button
          onClick={() => {
            setShowAddEventModal(false);
            setShowDatePicker(false);
            setShowMonthPickerInModal(false);
            setShowYearPickerInModal(false);
            setShowTimeFromPicker(false);
            setShowTimeToPicker(false);
            setNewEventData({ date: "", timeFrom: "", description: "" });
          }}
                style={{
                  padding: "8px 16px",
                  background: themeData.surfaceElevated,
                  color: themeData.text,
                  border: `2px solid ${themeData.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeData.surface;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = themeData.surfaceElevated;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Anuluj
              </button>
              <button
                onClick={addEvent}
                style={{
                  padding: "8px 16px",
                  background: `linear-gradient(135deg, ${themeData.accent} 0%, ${themeData.accentHover} 100%)`,
                  color: "white",
                  border: `2px solid ${themeData.accent}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  boxShadow: `0 4px 12px ${themeData.glow}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 6px 16px ${themeData.glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${themeData.glow}`;
                }}
              >
                ➕ Dodaj wydarzenie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
