# gannt-d3
Build Gannt charts with custom json
## Output
![Alt text](example.jpg?raw=true "Example")
## Usage
General input format
```
{
    "Category":"Cat3", //give one or many events a cetegory name
    "Start_Date": "2022-04-01", //starting date in YYYY-mm-dd format
    "End_Date": "2022-06-01", //ending date in YYYY-mm-dd format
    "Long": "Ignored event, long", //long description (current not used)
    "Name":"Ignored event", //name displayed on left
    "id": 3, //give each event a unique id
    "prog": 0, //designate the progress bar to fill each event
    "dep": "1,2,3", //reference dependancy of other event id's in csv format
    "ignore":1, //optionally ignore the event, options 0=no,1=yes
    "fill":"#0C53D9" //optional fill color, references legned below
},
```
Special dates, optional
```
{
    "_type":"keydate",
    "Date":"2021-09-15",
    "Name":"Special Date 1"
},
```
Legend, optional
```
{
    "_type":"legend", //do not change
    "#967008":"Type1", //reference event types above by "fill" property
    "#F98B88":"Type2",
    "#0C53D9":"Type3"
},
```

