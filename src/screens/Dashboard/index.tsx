import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HighlightCard } from '../../components/HighlightCard';
import { useTheme } from 'styled-components';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';
import { useAuth } from '../../hooks/auth';

import {
    Container,
    Header,
    UserWrapper,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    UserName,
    Icon,
    HighlightCards,
    Transactions,
    Title,
    TransactionList,
    LogoutButton,
    LoadContainer,
    } from './styles';

export interface DataListProps extends TransactionCardProps {
    id: string;
};

interface HighlightProps{
    amount: string,
    lastTransaction: string,
}

interface HighlightData {
    entries: HighlightProps,
    expensives: HighlightProps,
    total: HighlightProps,
}

export function Dashboard(){
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<DataListProps[]>([]);
    const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);
    
    const theme = useTheme();
    const {signOut, user} = useAuth();


    function getLastTransactionDate(collection: DataListProps[], type: 'positive' | 'negative'){

        const collectionFilttered = collection.filter(transaction => transaction.type === type);

        if(collectionFilttered.length === 0)
        return 0

        const lastTransaction = new Date(Math.max.apply(Math, collectionFilttered
            .map(transaction => new Date(transaction.date).getTime())));
            
        return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long'})}`
    }

    async function loadTransactions(){
        const dataKey = `@financecontroller:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const transactions = response ? JSON.parse(response) : [];

        let entriesTotal = 0;
        let expensiveTotal = 0; 

        const transactionFormatted: DataListProps[] = transactions.map((item : DataListProps)  => {

            if(item.type === 'positive'){
                entriesTotal += Number(item.amount);
            }else{
                expensiveTotal += Number(item.amount);
            }

            const amount = Number(item.amount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            const date = Intl.DateTimeFormat('pt-BR',{
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            }).format(new Date(item.date));

            return{
                id: item.id,
                name: item.name,
                amount: amount,
                type: item.type,
                category: item.category,
                date: date,
            }
        });

        setTransactions(transactionFormatted);
        const lastTransactionEntries = getLastTransactionDate(transactions, 'positive')
        const lastTransactionExpensives = getLastTransactionDate(transactions, 'negative')


        const totalInterval = lastTransactionExpensives === 0 
        ? `N??o h?? transa????es de sa??da` 
        : `1 a ${lastTransactionExpensives}`;
        
        const total = entriesTotal - expensiveTotal;

        setHighlightData({
            entries:{
                amount: entriesTotal.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRl',
                }),
                lastTransaction: lastTransactionEntries === 0
                ? 'N??o h?? transa????es de entrada'
                : `??ltima entrada dia ${lastTransactionEntries}`,
            },
            expensives:{
                amount: expensiveTotal.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRl',
                }),
                lastTransaction: lastTransactionExpensives === 0
                ? 'N??o h?? transa????es de sa??da'
                : `??ltima sa??da dia ${lastTransactionExpensives}`, 
            },
            total:{
                amount: total.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRl',
                }),
                lastTransaction: totalInterval,
            }
        });

        setIsLoading(false);
    }

    useEffect(() => {
        loadTransactions();

        //const dataKey = '@financecontroller:transactions';
        //const response = AsyncStorage.removeItem(dataKey);
    }, []);

    useFocusEffect(useCallback(() => {
        loadTransactions();
    },[]));

    return (
        <Container>
            {
            isLoading ?
            <LoadContainer>
                <ActivityIndicator color={theme.colors.secondary} size="large" />
            </LoadContainer> :
            <>            
                <Header> 
                <UserWrapper>
                    <UserInfo>
                        <Photo source={{ uri: user.photo }}/>
                        <User>
                            <UserGreeting>Ol??,</UserGreeting>
                            <UserName>{user.name}</UserName>
                        </User>
                    </UserInfo>
                    
                    <LogoutButton onPress={signOut}> 
                        <Icon name="power" />
                    </LogoutButton>

                </UserWrapper>
                </Header>
                <HighlightCards>
                    <HighlightCard
                        type='positive' 
                        title="Entradas"
                        amount={highlightData.entries.amount}
                        lastTransaction={highlightData.entries.lastTransaction}
                    />
                    <HighlightCard
                        type='negative' 
                        title="Sa??das"
                        amount={highlightData.expensives.amount}
                        lastTransaction={highlightData.expensives.lastTransaction}
                    />
                    <HighlightCard 
                        type='total' 
                        title="Total"
                        amount={highlightData.total.amount}
                        lastTransaction={highlightData.total.lastTransaction}
                    />              
                </HighlightCards>
                <Transactions>
                    <Title>Listagem</Title>
                <TransactionList 
                    data={transactions}
                    keyExtractor={item => item.id}
                    renderItem={({item}) => <TransactionCard data={item} /> }
                    />
                </Transactions>
            </>
        }
        </Container>
    )
}