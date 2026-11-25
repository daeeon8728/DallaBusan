type EnglishNameExpression=['coalesce',['get',string],['get',string],string];
export function englishNameField(value:unknown):EnglishNameExpression|null {
 if(!value||!JSON.stringify(value).includes('name'))return null;
 return ['coalesce',['get','name:en'],['get','name:latin'],''];
}
