'use client';

import 'react-day-picker/dist/style.css';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';

import './calendar-style.css'; // On va créer ce fichier juste après

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  return (
    <div className="calendar-wrapper">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(date) => {
          if (date instanceof Date || date === undefined) {
            onSelect(date);
          }
        }}
        showOutsideDays
        className="custom-calendar"
      />
      {selected && (
        <div className="selected-date">
          Date sélectionnée : <strong>{format(selected, 'PPP')}</strong>
        </div>
      )}
    </div>
  );
}