export const renderCalendarGrid = (grid, currentDate, events, onCreateDayElement) => {
    if (!grid) return;

    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    grid.innerHTML = '';

    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysInPrevMonth - i);
        grid.appendChild(onCreateDayElement(daysInPrevMonth - i, date, true));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        grid.appendChild(onCreateDayElement(day, date, false, isToday));
    }

    const totalCells = grid.children.length - 7;
    const remainingCells = 42 - totalCells;

    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        grid.appendChild(onCreateDayElement(day, date, true));
    }
};

export const updateCalendarHeader = (element, date) => {
    if (!element) return;

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    element.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};
