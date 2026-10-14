import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Users, KeyRound, Check } from 'lucide-react';

export default function UserPinModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser
}) {
  if (!isOpen) return null;

  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setPin('');
    setError('');
  };

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyAndSwitch(selectedUser, nextPin);
      }
    }
  };

  const verifyAndSwitch = (userToSwitch, enteredPin) => {
    if (userToSwitch.pin === enteredPin) {
      onSwitchUser(userToSwitch);
      onClose();
    } else {
      setError('Incorrect 4-digit PIN! Default PINs: Admin: 1234, Cashier: 0000, Manager: 5678, Storekeeper: 4321');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold text-sm tracking-wide">Switch User / Lock POS</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* User selector cards */}
          <div className="grid grid-cols-2 gap-2">
            {users.map(u => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 text-slate-950 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold leading-tight truncate">{u.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize mt-1 flex items-center justify-between">
                    <span>{u.role}</span>
                    <span className="font-mono text-amber-600">PIN: {u.pin}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg font-medium leading-tight">
              {error}
            </p>
          )}

          {/* PIN Input Display */}
          <div className="text-center space-y-2">
            <div className="text-xs font-bold text-slate-700">
              Enter 4-digit PIN for <span className="text-amber-600">{selectedUser.name}</span>:
            </div>

            <div className="flex justify-center space-x-3 py-1">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    pin.length > i ? 'bg-amber-500 border-amber-500 scale-110' : 'border-slate-300 bg-slate-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Numeric PIN Pad */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setPin('');
                  else if (k === '⌫') setPin(pin.slice(0, -1));
                  else handleDigit(k);
                }}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm active:scale-95 transition flex items-center justify-center select-none"
              >
                {k}
              </button>
            ))}
          </div>

          {/* Quick unlock button */}
          <button
            type="button"
            onClick={() => verifyAndSwitch(selectedUser, selectedUser.pin)}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Fast Login as {selectedUser.name.split(' ')[0]} (Auto PIN)</span>
          </button>

        </div>
      </div>
    </div>
  );
}
