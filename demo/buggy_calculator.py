def calculate_average(numbers):
    total = 0
    for i in range(len(numbers)):
        total += numbers[i]
    return total / len(numbers)

if __name__ == "__main__":
    scores = [85, 90, 78, 92]
    print(f"Average score: {calculate_average(scores)}")
