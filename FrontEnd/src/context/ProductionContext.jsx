import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentShift, getFormattedDate } from '@utils/dateUtils';

const ProductionContext = createContext();

export const ProductionProvider = ({ children }) => {
    const [selectedShift, setSelectedShift] = useState(() => getCurrentShift());
    const [selectedDate, setSelectedDate] = useState(() => getFormattedDate());
    const [metaPorHora, setMetaPorHora] = useState(350);

    const lastShiftRef = useRef(selectedShift);
    const lastDateRef = useRef(selectedDate);
    const lastHourRef = useRef(new Date().getHours());

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentShift = getCurrentShift(now);
            const currentDate = getFormattedDate(now);
            const currentHour = now.getHours();

            const shiftChanged = currentShift !== lastShiftRef.current;
            const dateChanged = currentDate !== lastDateRef.current;
            const hourChanged = currentHour !== lastHourRef.current;

            if (shiftChanged || dateChanged) {
                lastShiftRef.current = currentShift;
                lastDateRef.current = currentDate;
                lastHourRef.current = currentHour;

                setSelectedShift(currentShift);
                setSelectedDate(currentDate);

                // Recarga completa en cada cambio de turno (06:00, 14:00, 23:00) y medianoche (00:00)
                window.location.reload();
                return;
            }

            if (hourChanged) {
                lastHourRef.current = currentHour;
                // Si el monitor quedó en otra fecha/turno, al cambio de hora vuelve al turno y fecha actuales
                setSelectedShift(currentShift);
                setSelectedDate(currentDate);
            }
        }, 15000); // Verifica cada 15 segundos

        return () => clearInterval(interval);
    }, []);

    const values = {
        selectedShift, setSelectedShift,
        selectedDate, setSelectedDate,
        metaPorHora, setMetaPorHora,
    };

    return (
        <ProductionContext.Provider value={values}>
            {children}
        </ProductionContext.Provider>
    );
};

export const useProduction = () => {
    const context = useContext(ProductionContext);
    if (!context) { throw new Error("useProduction debe usarse dentro de ProductionProvider"); }
    return context;
};
