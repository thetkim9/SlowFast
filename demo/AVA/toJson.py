with open('ava.pbtxt', "r") as infile:
    instring = infile.read()
    mid1 = instring.split("item")
    with open('ava.json', "w") as outfile:
        outfile.write("{")
        print("[")
        for item in mid1:
            index = item.find("name:")
            index2 = item.find("id:")
            index3 = item.find(" }")
            key = item[index+6:index2-1]
            val = item[index2+4:index3]
            print(val, end=", ")
            outfile.write(key+":"+val+",")
        print("]")
        outfile.write("}")
