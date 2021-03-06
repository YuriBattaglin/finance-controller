import React, {useState, useCallback} from "react";
import { ActivityIndicator } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { VictoryPie } from 'victory-native'
import { RFValue } from "react-native-responsive-fontsize";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { HistoryCard } from "../../components/HistoryCard";
import {
    Container,
    Header,
    Title,
    Content,
    ChartContainer,
    MonthSelectButton,
    MonthSelect,
    MonthSelectIcon,
    Month,
    LoadContainer,
} from './styles'
import { categories } from "../../utils/categories";
import { useTheme } from 'styled-components';
import { useAuth } from "../../hooks/auth";

interface TransactionData{
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string;
}

interface CategoryData{
    key: string;
    name: string;
    total: number;
    totalFormatted: string;
    color: string;
    percent: string;
}

export function Resume(){
    const [selectedDate, setSelectedDate] = useState(new Date);
    const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    function handleChangeDate(action: 'next' | 'prev'){

        if(action === 'next'){
            setSelectedDate(addMonths(selectedDate, 1));
        }else{
            setSelectedDate(subMonths(selectedDate, 1));
        }
    }

    async function loadData(){
        setIsLoading(true);
        const dataKey = `@financecontroller:transactions_user:${user.id}`;
        const response = await AsyncStorage.getItem(dataKey);
        const responseFormatted = response ? JSON.parse(response) : [];

        const expensives = responseFormatted
        .filter((expensive : TransactionData) =>
         expensive.type === 'negative' &&
         new Date(expensive.date).getMonth() === selectedDate.getMonth() &&
         new Date(expensive.date).getFullYear() === selectedDate.getFullYear()
         );
        
        const expensivesTotal = expensives
        .reduce((acumullator : number, expensive : TransactionData) => {
            return acumullator + Number(expensive.amount);
        }, 0);

        const totalByCategory : CategoryData[] = [];

        categories.forEach(category => {
            let categorySum = 0;

            expensives.forEach((expensive : TransactionData) => {
                if(expensive.category === category.key){
                    categorySum += Number(expensive.amount);
                }
            });

            if(categorySum > 0){
                const totalFormatted = categorySum.toLocaleString('pt-BR',{
                    style: 'currency',
                    currency: 'BRL'
                })

                const percent = `${(categorySum / expensivesTotal * 100).toFixed(0)}%`;

                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    color: category.color,
                    totalFormatted: totalFormatted,
                    total: categorySum,
                    percent: percent,
                });
            }
        });
        setTotalByCategories(totalByCategory);
        setIsLoading(false);
    }
    
    useFocusEffect(useCallback(() => {
        loadData();
    },[selectedDate]));

    return(
        <Container>
            <Header>
                <Title>Resumo por categoria</Title>
            </Header>

            {
            isLoading ?
            <LoadContainer>
                <ActivityIndicator color={theme.colors.secondary} size="large" />
            </LoadContainer> :
            
            <Content
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                     flex: 1,
                     paddingHorizontal: 24, 
                     paddingBottom: useBottomTabBarHeight(), 
                }}
            >

                <MonthSelect>
                    <MonthSelectButton onPress={() => handleChangeDate('prev')}>
                        <MonthSelectIcon name="chevron-left"/>
                    </MonthSelectButton>

                    <Month>
                        {format(selectedDate,'MMMM, yyyy', {locale: ptBR})}
                    </Month>

                    <MonthSelectButton onPress={() => handleChangeDate('next')}>
                        <MonthSelectIcon name="chevron-right" />
                    </MonthSelectButton>
                </MonthSelect>

                <ChartContainer>
                    <VictoryPie
                    data={totalByCategories}
                    colorScale={totalByCategories.map(category => category.color)}
                    style={{
                        labels: { 
                            fontSize: RFValue(18),
                            fontWeight: 'bold',
                            fill: theme.colors.shape,
                        }
                    }}
                    labelRadius={90}
                    x="percent"
                    y="total"
                    />
                </ChartContainer>
            {
                totalByCategories.map(item =>(
                    <HistoryCard 
                    key={item.key}
                    title={item.name}
                    amount={item.totalFormatted}
                    color={item.color}
                    ></HistoryCard>
                ))
            }
            </Content>
        }
        </Container>
    )
}