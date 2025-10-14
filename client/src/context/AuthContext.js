import { createContext, useReducer } from 'react';

const AuthContext = createContext();

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('token', action.payload.token);
            return { ...state, user: action.payload.user, token: action.payload.token };
        case 'LOGOUT':
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return { ...state, user: null, token: null };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <AuthContext.Provider value={{ state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
