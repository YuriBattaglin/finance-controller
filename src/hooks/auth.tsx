import React, { createContext, ReactNode, useContext } from 'react';

interface AuthProviderProps{
    children: ReactNode;
}

interface IAuthContextData{
    user: User;
}

interface User{
    id: string;
    name: string;
    email: string;
    photo?: string;
}

const AuthContext = createContext({} as IAuthContextData);

function AuthProvider({children} : AuthProviderProps){
    const user = {
        id: '1123424534',
        name: 'Yuri Battaglin',
        email: 'yuribattaglin@email.com'
    };

    return(
            <AuthContext.Provider value={{user}}>
            { children }
            </AuthContext.Provider>
        )
}

function useAuth(){
    const context = useContext(AuthContext);
    
    return context;
}

export { AuthProvider, useAuth }